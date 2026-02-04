import { PostConfirmationTriggerEvent, PostConfirmationTriggerHandler } from "aws-lambda";
import { DatabaseHelpers } from "../../lib/database";
import { addContactToBrevo } from "../../lib/brevo-service";

/**
 * Cognito Post-Confirmation Lambda Trigger
 *
 * This Lambda is automatically invoked by AWS Cognito after a user confirms their account.
 * It ensures that a user profile is created in DynamoDB after successful account confirmation.
 */
export const handler: PostConfirmationTriggerHandler = async (event: PostConfirmationTriggerEvent) => {
  console.log("📝 Post-confirmation trigger invoked");
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    const userId = event.request.userAttributes.sub;
    if (!userId) {
      console.error("User ID not found in user attributes");
      return event;
    }
    const email = event.request.userAttributes.email;
    if (!email) {
      console.error("Email not found in user attributes");
      return event;
    }
    const firstName = event.request.userAttributes.given_name || email.split("@")[0];
    const lastName = event.request.userAttributes.family_name || "";

    console.log(`Creating profile for user: ${email} (${userId})`);

    // Check if profile already exists (with retry for race conditions)
    let existingProfile = await DatabaseHelpers.getUserProfile(userId);

    // If profile doesn't exist, wait a bit and check again (handles race condition with guest-signup)
    if (!existingProfile) {
      console.log("Profile not found on first check, retrying after delay...");
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      existingProfile = await DatabaseHelpers.getUserProfile(userId);
    }

    if (existingProfile) {
      console.log(`Profile already exists for user ${userId} with status: ${existingProfile.status}`);
      // IMPORTANT: Don't modify existing profiles - guest-signup or other flows have already set them up
      // But still add to Brevo to ensure they're in the email list
      console.log("📧 Adding existing user to Brevo email list");
      try {
        const brevoResult = await addContactToBrevo(email, {
          firstName: existingProfile.firstName || firstName,
          lastName: existingProfile.lastName || lastName,
          accountStatus: existingProfile.status || "verified_free",
          signupSource: "post_confirmation",
        });

        if (brevoResult.success) {
          console.log("✅ Contact added to Brevo successfully:", brevoResult.contactId);
        } else {
          console.warn("⚠️  Failed to add contact to Brevo:", brevoResult.message);
        }
      } catch (brevoError) {
        console.error("❌ Error adding contact to Brevo:", brevoError);
      }
      return event; // Return event to allow Cognito to continue
    }

    // Only create profile if it truly doesn't exist after retries
    // This should only happen for non-guest signups (e.g., standard registration)
    console.log("Creating new profile for standard (non-guest) signup");
    await DatabaseHelpers.createUserProfile({
      userId,
      email,
      firstName,
      lastName,
      role: "student",
      status: "verified_free",
      showOnLeaderboard: true,
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ Profile created successfully for user ${userId}`);

    // Add user to Brevo email marketing list
    console.log("📧 Adding contact to Brevo email list");
    try {
      const brevoResult = await addContactToBrevo(email, {
        firstName,
        lastName,
        accountStatus: "verified_free",
        signupSource: "post_confirmation",
      });

      if (brevoResult.success) {
        console.log("✅ Contact added to Brevo successfully:", brevoResult.contactId);
      } else {
        console.warn("⚠️  Failed to add contact to Brevo:", brevoResult.message);
      }
    } catch (brevoError) {
      console.error("❌ Error adding contact to Brevo:", brevoError);
      // Don't fail post-confirmation if Brevo integration fails
    }
  } catch (error) {
    console.error("❌ Error in post-confirmation trigger:", error);
    // Don't throw error - we don't want to block user confirmation
    // Profile can be created later through other means if needed
  }

  // Always return the event to allow Cognito to complete the confirmation
  return event;
};