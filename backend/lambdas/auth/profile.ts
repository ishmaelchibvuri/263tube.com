import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../../lib/auth-middleware";
import { validateRequest, userSchemas } from "../../lib/validation";
import { DatabaseHelpers } from "../../lib/database";
import { UpdateProfileRequest } from "../../lib/types";
import { withCorsWrapper } from "../../lib/cors-wrapper";
import { sendGoodbyeEmail } from "../../lib/email-service";
import { trackProfileCompleted } from "../../lib/brevo-service";
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;

// Helper to extract user from authorizer context
function getUserFromAuthorizerContext(event: APIGatewayProxyEvent): {
  userId: string;
  email: string;
  username: string;
} {
  // The API Gateway authorizer puts user info in the request context
  const authorizer = event.requestContext?.authorizer;

  if (!authorizer || !authorizer.userId) {
    throw new Error("No user information in request context");
  }

  return {
    userId: authorizer.userId,
    email: authorizer.email || "",
    username: authorizer.username || "",
  };
}

const baseHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // 🔧 FIX: Get user from authorizer context instead of re-authenticating
    // The API Gateway authorizer already validated the token and put user info here
    const user = getUserFromAuthorizerContext(event);

    console.log("📋 Request details:");
    console.log("Method:", event.httpMethod);
    console.log("User ID:", user.userId);
    console.log("Email:", user.email);

    if (event.httpMethod === "GET") {
      // Get user profile
      console.log("Fetching profile for user:", user.userId);
      const userProfile = await DatabaseHelpers.getUserProfile(user.userId);

      if (!userProfile) {
        console.log("❌ User profile not found in database");
        return createErrorResponse(404, "User profile not found", undefined, event);
      }

      console.log("✅ Profile found:", userProfile.email);
      return createSuccessResponse({
        userId: userProfile.userId,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        role: userProfile.role,
        showOnLeaderboard: userProfile.showOnLeaderboard,
        isActive: userProfile.isActive,
        createdAt: userProfile.createdAt,
        lastLoginAt: userProfile.lastLoginAt,
        profilePicture: userProfile.profilePicture,
      }, 200, event);
    }

    if (event.httpMethod === "PUT") {
      // Update user profile
      console.log("📝 Processing PUT request to update profile");
      console.log("Request body:", event.body);

      const body = JSON.parse(event.body || "{}");
      console.log("Parsed body:", JSON.stringify(body));

      const validatedData = validateRequest<UpdateProfileRequest>(userSchemas.updateProfile, body);
      console.log("Validated data:", JSON.stringify(validatedData));

      const updateData: any = {};
      if (validatedData.firstName !== undefined)
        updateData.firstName = validatedData.firstName;
      if (validatedData.lastName !== undefined)
        updateData.lastName = validatedData.lastName;
      if (validatedData.showOnLeaderboard !== undefined)
        updateData.showOnLeaderboard = validatedData.showOnLeaderboard;
      if (validatedData.profilePicture !== undefined)
        updateData.profilePicture = validatedData.profilePicture;

      updateData.updatedAt = new Date().toISOString();
      console.log("Update data:", JSON.stringify(updateData));

      // Check if profile exists, create if not
      const existingProfile = await DatabaseHelpers.getUserProfile(user.userId);
      console.log("Existing profile:", existingProfile ? "found" : "not found");

      if (!existingProfile) {
        // Create new profile if it doesn't exist
        console.log("Creating new profile for user:", user.userId);
        await DatabaseHelpers.createUserProfile({
          userId: user.userId,
          email: user.email,
          firstName: updateData.firstName || "",
          lastName: updateData.lastName || "",
          role: "user",
          status: "active",
          showOnLeaderboard: updateData.showOnLeaderboard ?? false,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
        console.log("✅ Profile created successfully");
      } else {
        // Update existing profile
        console.log("Updating existing profile for user:", user.userId);
        await DatabaseHelpers.updateUserProfile(user.userId, updateData);
        console.log("✅ Profile updated successfully");
      }

      // Update Cognito user attributes so frontend shows updated values
      if (validatedData.firstName !== undefined || validatedData.lastName !== undefined) {
        console.log("📝 Updating Cognito user attributes...");
        try {
          const cognitoAttributes = [];
          if (validatedData.firstName !== undefined) {
            cognitoAttributes.push({ Name: "given_name", Value: validatedData.firstName });
          }
          if (validatedData.lastName !== undefined) {
            cognitoAttributes.push({ Name: "family_name", Value: validatedData.lastName });
          }

          const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: user.userId,
            UserAttributes: cognitoAttributes,
          });
          await cognitoClient.send(updateAttributesCommand);
          console.log("✅ Cognito attributes updated successfully");
        } catch (cognitoError) {
          console.error("⚠️ Failed to update Cognito attributes:", cognitoError);
          // Don't fail the request if Cognito update fails - DynamoDB is updated
        }
      }

      // Track profile completion in Brevo if firstName and lastName are now both set
      if (validatedData.firstName && validatedData.lastName && user.email) {
        console.log("📧 Profile completed - tracking in Brevo");
        try {
          await trackProfileCompleted(user.email);
        } catch (brevoError) {
          console.error("⚠️ Brevo tracking failed (non-critical):", brevoError);
          // Don't fail the request if Brevo fails
        }
      }

      return createSuccessResponse({
        message: "Profile updated successfully",
        updatedFields: Object.keys(updateData),
      }, 200, event);
    }

    if (event.httpMethod === "DELETE") {
      // Delete user profile and all associated data
      console.log("🗑️  Starting user deletion process for user:", user.userId);
      console.log("Email:", user.email);
      console.log("Username:", user.username);

      try {
        // Step 0: Get user profile to retrieve first name for goodbye email
        console.log("Step 0: Fetching user profile for goodbye email...");
        const userProfile = await DatabaseHelpers.getUserProfile(user.userId);
        const firstName = userProfile?.firstName;
        console.log("✅ User profile fetched");

        // Step 1: Send goodbye email (before deletion so we have user data)
        console.log("Step 1: Sending goodbye email...");
        try {
          await sendGoodbyeEmail(user.email, firstName);
          console.log("✅ Goodbye email sent successfully");
        } catch (emailError) {
          console.error("⚠️  Failed to send goodbye email:", emailError);
          // Don't fail deletion if email fails - continue with deletion
        }

        // Step 2: Delete all user data from DynamoDB
        console.log("Step 2: Deleting all user data from database...");
        await DatabaseHelpers.deleteUserAndAllData(user.userId);
        console.log("✅ Database deletion completed");

        // Step 3: Delete user from Cognito
        console.log("Step 3: Deleting user from Cognito...");
        const deleteUserCommand = new AdminDeleteUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: user.username,
        });
        await cognitoClient.send(deleteUserCommand);
        console.log("✅ Cognito user deletion completed");

        console.log("✅ User deletion process completed successfully");
        return createSuccessResponse({
          message: "Account deleted successfully",
          userId: user.userId,
        }, 200, event);
      } catch (error) {
        console.error("❌ Error during user deletion:", error);

        // If we fail after database deletion but before Cognito deletion,
        // the user's data is already gone from the database but they still exist in Cognito.
        // This is acceptable as they can't access any data anymore.
        if (error instanceof Error) {
          return createErrorResponse(500, `Failed to delete account: ${error.message}`, undefined, event);
        }
        throw error;
      }
    }

    return createErrorResponse(405, "Method not allowed", undefined, event);
  } catch (error) {
    console.error("❌ Profile error:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      if (error.message.includes("Validation error")) {
        return createErrorResponse(400, error.message, undefined, event);
      }
      if (error.message.includes("No user information in request context")) {
        return createErrorResponse(401, "Authentication required", undefined, event);
      }
    }

    return createErrorResponse(500, "Internal server error", undefined, event);
  }
};

export const handler = withCorsWrapper(baseHandler);
