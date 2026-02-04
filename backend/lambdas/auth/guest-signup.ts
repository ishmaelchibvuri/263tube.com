import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DatabaseHelpers } from "../../lib/database";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { randomBytes } from "crypto";
import { withCorsWrapper } from "../../lib/cors-wrapper";
import {
  generateVerificationCode,
  sendGuestActivationEmail,
} from "../../lib/email-service";
import { addContactToBrevo } from "../../lib/brevo-service";
import { LeaderboardCalculator } from "../../lib/leaderboard-calculator";

const cognitoClient = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;

// Helper function to get ISO week number
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

interface GuestSignupRequest {
  email: string;
  quizScore?: number;
  quizPercentage?: number;
  quizAnswers?: number[]; // Array of selected answer indices
  referralCode?: string;
}

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body: GuestSignupRequest = JSON.parse(event.body || "{}");
    const { email, quizScore, quizPercentage, quizAnswers, referralCode } = body;

    if (!email || !email.includes("@")) {
      return createErrorResponse(400, "Valid email address is required", undefined, event);
    }

    console.log("📝 Guest signup attempt for:", email);

    // Check if user already exists
    const existingUserByEmail = await DatabaseHelpers.getUserByEmail(email);
    if (existingUserByEmail) {
      console.log("⚠️  User already exists with this email");
      return createErrorResponse(400, "An account with this email already exists. Please login instead.", undefined, event);
    }

    // Generate a temporary password that meets Cognito requirements:
    // minLength: 8, requireLowercase, requireUppercase, requireDigits, requireSymbols
    const randomHex = randomBytes(8).toString("hex"); // lowercase letters and digits
    const temporaryPassword = `${randomHex.toUpperCase().slice(0, 4)}${randomHex.slice(4)}!Aa1`;

    // Create user in Cognito with temporary password
    try {
      // Extract first name from email (part before @)
      const emailUsername = email.split("@")[0];

      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" }, // Mark as verified for guest accounts
          { Name: "given_name", Value: emailUsername }, // Required attribute
          { Name: "family_name", Value: "Guest" }, // Required attribute
        ],
        TemporaryPassword: temporaryPassword,
        // Suppress Cognito's email - we'll send our own via SES
        MessageAction: "SUPPRESS",
      });

      const createUserResult = await cognitoClient.send(createUserCommand);

      if (!createUserResult.User || !createUserResult.User.Username) {
        throw new Error("Failed to create user in Cognito");
      }

      const userId = createUserResult.User.Attributes?.find(attr => attr.Name === "sub")?.Value;

      if (!userId) {
        throw new Error("Failed to get user ID from Cognito");
      }

      console.log("✅ Cognito user created with ID:", userId);

      // Create user profile in database BEFORE setting password as permanent
      // This prevents race condition with post-confirmation trigger
      console.log("📝 Creating guest user profile in DynamoDB");
      await DatabaseHelpers.createUserProfile({
        userId,
        email,
        firstName: emailUsername, // Use email prefix as temporary first name
        lastName: "Guest",
        role: "student",
        status: "unverified_guest", // Mark as guest account
        showOnLeaderboard: false, // Guests don't appear on leaderboard by default
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      console.log("✅ Guest user profile created successfully");

      // Wait a bit to ensure DynamoDB write propagates (helps avoid race condition)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verify profile was created before continuing
      const verifyProfile = await DatabaseHelpers.getUserProfile(userId);
      if (!verifyProfile || verifyProfile.status !== "unverified_guest") {
        console.error("❌ Profile verification failed or status incorrect");
        throw new Error("Failed to create guest profile correctly");
      }
      console.log("✅ Guest profile verified with status:", verifyProfile.status);

      // Set the temporary password as permanent (user won't need to change it)
      // NOTE: This will trigger post-confirmation Lambda, but profile already exists
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: temporaryPassword,
        Permanent: true,
      });
      await cognitoClient.send(setPasswordCommand);
      console.log("✅ Password set as permanent");

      // Create an exam attempt for the onboarding quiz to start their streak
      if (quizScore !== undefined && quizPercentage !== undefined) {
        console.log("📝 Creating onboarding quiz attempt record");

        const attemptId = `${userId}-onboarding-${Date.now()}`;
        const timestamp = new Date().toISOString();
        const date = timestamp.split("T")[0];
        const week = getISOWeek(new Date());
        const month = timestamp.substring(0, 7);
        const year = new Date().getFullYear().toString();
        const totalQuestions = 10; // Landing page quiz has 10 questions

        const attemptData = {
          attemptId,
          userId,
          examId: "ONBOARDING_QUIZ",
          examTitle: "Welcome Quiz",
          score: quizScore,
          percentage: quizPercentage,
          totalQuestions,
          correctAnswers: quizScore,
          timeTaken: 0, // Not tracked for onboarding quiz
          isPassed: quizPercentage >= 60,
          startedAt: timestamp,
          submittedAt: timestamp,
          date,
          week,
          month,
          year,
          timestamp,
        };

        await DatabaseHelpers.createExamAttempt(attemptData);

        console.log(`✅ Onboarding quiz attempt created - Score: ${quizScore}/${totalQuestions} (${quizPercentage}%)`);

        // Store individual quiz answers if provided
        if (quizAnswers && Array.isArray(quizAnswers) && quizAnswers.length === totalQuestions) {
          console.log("📝 Storing individual quiz answers");

          // Get the quiz questions from the database to match answers
          const examQuestions = await DatabaseHelpers.getExamQuestions("ONBOARDING_QUIZ");

          for (let i = 0; i < quizAnswers.length; i++) {
            const questionNumber = i + 1;
            const userAnswerIndex = quizAnswers[i];
            const question = examQuestions.find((q: any) => q.questionNumber === questionNumber);

            if (!question) {
              console.warn(`⚠️  Question ${questionNumber} not found in database`);
              continue;
            }

            if (userAnswerIndex === undefined || typeof userAnswerIndex !== 'number') {
              console.warn(`⚠️  Invalid answer index for question ${questionNumber}`);
              continue;
            }

            const selectedAnswerId = question.options[userAnswerIndex]?.id || "";
            const selectedAnswerText = question.options[userAnswerIndex]?.text || "";
            const isCorrect = question.options[userAnswerIndex]?.isCorrect || false;
            const correctOption = question.options.find((opt: any) => opt.isCorrect);

            const answerRecord = {
              PK: `ATTEMPT#${attemptId}`,
              SK: `ANSWER#${questionNumber}`,
              questionId: question.questionId,
              questionNumber,
              questionText: question.questionText,
              selectedAnswers: [selectedAnswerId],
              selectedAnswerTexts: [selectedAnswerText],
              correctAnswers: [correctOption?.id || question.correctAnswer],
              correctAnswerTexts: [correctOption?.text || ""],
              isCorrect,
              points: isCorrect ? 10 : 0,
              timeTaken: 0,
              explanation: question.explanation || "",
            };

            await DatabaseHelpers.putItem(answerRecord);
          }

          console.log(`✅ Stored ${quizAnswers.length} quiz answers`);
        }

        // Update leaderboards for onboarding quiz
        console.log("📊 Updating leaderboards for onboarding quiz");
        try {
          await LeaderboardCalculator.updateLeaderboards(attemptData);
          console.log("✅ Leaderboards updated successfully");
        } catch (leaderboardError) {
          console.error("❌ Failed to update leaderboards:", leaderboardError);
          // Don't fail signup if leaderboard update fails
        }
      }

      // Track referral if referral code was provided
      if (referralCode) {
        console.log("📝 Processing referral code:", referralCode);

        // Find the referrer by their referral code
        const allUsers = await DatabaseHelpers.getAllUsers();
        const referrer = allUsers.find(u => u.referralCode === referralCode);

        if (referrer) {
          console.log("✅ Found referrer:", referrer.userId);

          // Create referral record
          await DatabaseHelpers.createReferral({
            referrerId: referrer.userId,
            referredEmail: email,
            referralCode: referralCode,
          });

          console.log("✅ Referral record created successfully");
        } else {
          console.log("⚠️  Referral code not found, skipping referral tracking");
        }
      }

      // Authenticate the user immediately
      const authCommand = new AdminInitiateAuthCommand({
        UserPoolId: USER_POOL_ID,
        ClientId: USER_POOL_CLIENT_ID,
        AuthFlow: "ADMIN_NO_SRP_AUTH",
        AuthParameters: {
          USERNAME: email,
          PASSWORD: temporaryPassword,
        },
      });

      const authResult = await cognitoClient.send(authCommand);

      if (!authResult.AuthenticationResult) {
        throw new Error("Failed to authenticate user");
      }

      console.log("✅ User authenticated successfully");

      // Generate and store verification code
      const verificationData = generateVerificationCode();
      console.log("📝 Storing verification code");
      await DatabaseHelpers.storeVerificationCode(
        userId,
        email,
        verificationData.code,
        verificationData.expiresAt
      );
      console.log("✅ Verification code stored");

      // Send custom activation email via SES with beautiful branding
      console.log("📧 Sending custom activation email via SES");
      console.log("🔑 Verification code generated:", verificationData.code);

      try {
        await sendGuestActivationEmail(email, verificationData.code, temporaryPassword);
        console.log("✅ Guest activation email sent successfully via SES");
      } catch (emailError) {
        console.error("❌ Failed to send guest activation email:", emailError);
        // Don't fail the signup if email fails - user can still use the returned credentials
      }

      // Add user to Brevo email marketing list
      console.log("📧 Adding contact to Brevo email list");
      try {
        const brevoResult = await addContactToBrevo(email, {
          firstName: emailUsername,
          lastName: "Guest",
          signupSource: "landing_page_quiz",
          quizScore: quizScore?.toString(),
          quizPercentage: quizPercentage?.toString(),
        });

        if (brevoResult.success) {
          console.log("✅ Contact added to Brevo successfully:", brevoResult.contactId);
        } else {
          console.warn("⚠️  Failed to add contact to Brevo:", brevoResult.message);
        }
      } catch (brevoError) {
        console.error("❌ Error adding contact to Brevo:", brevoError);
        // Don't fail signup if Brevo integration fails
      }

      return createSuccessResponse({
        success: true,
        message: "Guest account created successfully. Check your email for login instructions.",
        userId,
        email,
        status: "unverified_guest",
        temporaryPassword, // Include password for frontend auto-login
        verificationCode: verificationData.code, // Include for testing until SES is approved
        sessionToken: authResult.AuthenticationResult.IdToken,
        accessToken: authResult.AuthenticationResult.AccessToken,
        refreshToken: authResult.AuthenticationResult.RefreshToken,
        expiresIn: authResult.AuthenticationResult.ExpiresIn,
        quizScore,
        quizPercentage,
      }, event);
    } catch (cognitoError: any) {
      console.error("❌ Cognito error:", cognitoError);

      if (cognitoError.name === "UsernameExistsException") {
        return createErrorResponse(400, "An account with this email already exists. Please login instead.", undefined, event);
      }

      throw cognitoError;
    }
  } catch (error) {
    console.error("❌ Guest signup error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      if (error.message.includes("Validation error")) {
        return createErrorResponse(400, error.message, undefined, event);
      }
      if (error.message.includes("already exists")) {
        return createErrorResponse(400, "An account with this email already exists. Please login instead.", undefined, event);
      }
    }

    // Return more detailed error in development
    const errorMessage = error instanceof Error
      ? `Internal server error: ${error.message}`
      : "Internal server error during guest signup";

    return createErrorResponse(500, errorMessage, undefined, event);
  }
};

export const handler = withCorsWrapper(baseHandler);
