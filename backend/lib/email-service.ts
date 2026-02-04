import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { randomBytes } from "crypto";
import { DatabaseHelpers } from "./database";

const sesClient = new SESClient({ region: process.env.AWS_REGION || "af-south-1" });
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@regulatoryexams.co.za";

/**
 * Replace variables in template with actual values
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }
  return rendered;
}

/**
 * Get email template from database or fallback to hardcoded
 */
async function getTemplate(templateId: string, variables: Record<string, string>, fallbackHtml: string, fallbackText: string, fallbackSubject: string): Promise<{ html: string; text: string; subject: string }> {
  try {
    // Try to get template from database
    const dbTemplate = await DatabaseHelpers.getActiveEmailTemplate(templateId);

    if (dbTemplate) {
      console.log(`✅ Using database template for: ${templateId}`);
      return {
        html: renderTemplate(dbTemplate.htmlBody, variables),
        text: renderTemplate(dbTemplate.textBody, variables),
        subject: renderTemplate(dbTemplate.subject, variables),
      };
    }
  } catch (error) {
    console.warn(`⚠️  Failed to fetch template ${templateId} from database, using fallback:`, error);
  }

  // Fallback to hardcoded templates
  console.log(`📄 Using fallback template for: ${templateId}`);
  return {
    html: renderTemplate(fallbackHtml, variables),
    text: renderTemplate(fallbackText, variables),
    subject: fallbackSubject,
  };
}

export interface VerificationCode {
  code: string;
  expiresAt: string;
}

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): VerificationCode {
  const code = randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  return { code, expiresAt };
}

/**
 * Send verification email to guest user
 */
export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  const variables = {
    code,
    currentYear: new Date().getFullYear().toString(),
    supportEmail: 'support@regulatoryexams.co.za',
  };

  const fallbackHtmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fdf2f8 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">

          <!-- Gradient Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); padding: 50px 40px; text-align: center;">
              <div style="background: rgba(255, 255, 255, 0.2); border-radius: 20px; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px; line-height: 1;">🎓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Regulatory Exams!</h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400;">Your journey to exam success starts here</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="content" style="padding: 50px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700;">Verify Your Email Address</h2>
              <p style="margin: 0 0 28px 0; color: #4b5563; font-size: 17px; line-height: 1.7;">
                Thank you for signing up! To complete your account setup and unlock all premium features, please verify your email address using the code below.
              </p>

              <!-- Verification Code Card -->
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%); border: 3px solid transparent; background-clip: padding-box; border-radius: 16px; padding: 40px 30px; text-align: center; margin: 32px 0; position: relative;">
                <div style="position: absolute; top: -3px; left: -3px; right: -3px; bottom: -3px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); border-radius: 16px; z-index: -1;"></div>
                <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your Verification Code</p>
                <p style="margin: 0; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                  ${code}
                </p>
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">Valid for 24 hours</p>
              </div>

              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%); border-left: 4px solid #7c3aed; border-radius: 12px; padding: 20px 24px; margin: 32px 0;">
                <p style="margin: 0 0 4px 0; color: #7c3aed; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">How to verify</p>
                <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                  Enter this code in the app to verify your email and set your permanent password.
                </p>
              </div>

              <!-- Features Grid -->
              <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 12px; padding: 28px; margin: 32px 0;">
                <p style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 700;">What's waiting for you:</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #2563eb; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">Unlimited practice questions from real RE5 exams</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #7c3aed; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">Advanced performance analytics and progress tracking</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #db2777; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">Compete on leaderboards with other professionals</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #2563eb; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">Personalized study recommendations based on your performance</span>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 28px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6; text-align: center;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 15px;">
                Need help? We're here for you!<br>
                <a href="mailto:support@regulatoryexams.co.za" style="color: #7c3aed; text-decoration: none; font-weight: 600;">support@regulatoryexams.co.za</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                © ${new Date().getFullYear()} Regulatory Exams. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const fallbackTextBody = `
Welcome to Regulatory Exams!

Your verification code is: {{code}}

Enter this code in the app to verify your email and set your permanent password.

This code will expire in 24 hours. If you didn't create an account, you can safely ignore this email.

Need help? Contact us at {{supportEmail}}

© {{currentYear}} Regulatory Exams. All rights reserved.
  `;

  const template = await getTemplate(
    'verification',
    variables,
    fallbackHtmlBody,
    fallbackTextBody,
    'Verify Your Email - Regulatory Exams'
  );

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: template.subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: template.html,
          Charset: "UTF-8",
        },
        Text: {
          Data: template.text,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    await sesClient.send(command);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${email}:`, error);
    throw error;
  }
}

/**
 * Send guest activation email with verification code and temporary password
 */
export async function sendGuestActivationEmail(
  email: string,
  code: string,
  temporaryPassword: string
): Promise<void> {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activate Your Account</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px !important; }
      .button { padding: 14px 28px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fdf2f8 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">

          <!-- Gradient Header with Trophy -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); padding: 50px 40px; text-align: center;">
              <div style="background: rgba(255, 255, 255, 0.2); border-radius: 20px; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px; line-height: 1;">🎉</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Congratulations!</h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400;">You completed the RE5 knowledge test</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="content" style="padding: 50px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700;">Activate Your Account!</h2>
              <p style="margin: 0 0 28px 0; color: #4b5563; font-size: 17px; line-height: 1.7;">
                Great job on completing the test! We've created an account for you. Use the activation code below to set your password and unlock all features.
              </p>

              <!-- Verification Code Card -->
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%); border: 3px solid transparent; background-clip: padding-box; border-radius: 16px; padding: 40px 30px; text-align: center; margin: 32px 0; position: relative;">
                <div style="position: absolute; top: -3px; left: -3px; right: -3px; bottom: -3px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); border-radius: 16px; z-index: -1;"></div>
                <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your Activation Code</p>
                <p style="margin: 0; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                  ${code}
                </p>
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">Valid for 24 hours</p>
              </div>

              <!-- Next Steps -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%); border-left: 4px solid #7c3aed; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <p style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 700;">📋 How to activate:</p>
                <ol style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 15px; line-height: 2;">
                  <li><strong>Click</strong> the activation button below</li>
                  <li><strong>Enter</strong> your activation code from above</li>
                  <li><strong>Set</strong> your password</li>
                  <li><strong>Start</strong> practicing and tracking your progress!</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 36px 0 24px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://regulatoryexams.co.za'}/activate-account?email=${encodeURIComponent(email)}" class="button" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 700; font-size: 17px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                  Activate Your Account Now →
                </a>
              </div>

              <!-- Benefits Banner -->
              <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 12px; padding: 28px; margin: 32px 0;">
                <p style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 700;">✨ What's included:</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #2563eb; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">View your test results and detailed performance breakdown</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #db2777; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">Full access to leaderboards and community</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #2563eb; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">Upgrade anytime to unlock unlimited questions</span>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 28px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6; text-align: center;">
                <strong>Note:</strong> This activation code expires in 24 hours.<br>
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 15px;">
                Need help? We're here for you!<br>
                <a href="mailto:support@regulatoryexams.co.za" style="color: #7c3aed; text-decoration: none; font-weight: 600;">support@regulatoryexams.co.za</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                © ${new Date().getFullYear()} Regulatory Exams. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textBody = `
Thanks for completing the test!

We've created an account for you. Here are your activation details:

ACTIVATION CODE: ${code}

Next Steps:
1. Click this link to activate: ${process.env.FRONTEND_URL || 'https://regulatoryexams.co.za'}/activate-account?email=${encodeURIComponent(email)}
2. Enter the activation code above
3. Set your password
4. Start practicing and tracking your progress!

Your activation code expires in 24 hours.

Need help? Contact us at support@regulatoryexams.co.za

© ${new Date().getFullYear()} Regulatory Exams. All rights reserved.
  `;

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Activate Your Account - Regulatory Exams",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    await sesClient.send(command);
    console.log(`✅ Guest activation email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send guest activation email to ${email}:`, error);
    throw error;
  }
}

/**
 * Send welcome email after account completion
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<void> {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Regulatory Exams!</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px !important; }
      .button { padding: 14px 28px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fdf2f8 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">

          <!-- Celebration Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); padding: 50px 40px; text-align: center;">
              <div style="background: rgba(255, 255, 255, 0.2); border-radius: 20px; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px; line-height: 1;">🚀</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: -0.5px;">Welcome, ${firstName}!</h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400;">Your account is fully activated and ready to go</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="content" style="padding: 50px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700;">You're All Set!</h2>
              <p style="margin: 0 0 28px 0; color: #4b5563; font-size: 17px; line-height: 1.7;">
                Thank you for verifying your email and completing your account setup. You now have full access to all Regulatory Exams features and you're ready to start your journey to exam success!
              </p>

              <!-- Success Banner -->
              <div style="background: linear-gradient(135deg, #dcfce7 0%, #dbeafe 100%); border: 3px solid #10b981; border-radius: 16px; padding: 28px; margin: 32px 0; text-align: center;">
                <span style="font-size: 40px; line-height: 1;">✓</span>
                <p style="margin: 12px 0 0 0; color: #065f46; font-size: 18px; font-weight: 700;">Account Successfully Activated</p>
              </div>

              <!-- Quick Start Guide -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%); border-left: 4px solid #7c3aed; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <p style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 700;">🎯 Quick Start Guide:</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong style="color: #2563eb; font-size: 18px; margin-right: 12px;">1.</strong>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>Take practice quizzes</strong> to test your current knowledge level</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong style="color: #7c3aed; font-size: 18px; margin-right: 12px;">2.</strong>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>Attempt full mock exams</strong> that mirror the real RE5 test</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong style="color: #db2777; font-size: 18px; margin-right: 12px;">3.</strong>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>Track your progress</strong> on your personalized dashboard</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong style="color: #2563eb; font-size: 18px; margin-right: 12px;">4.</strong>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>Compete on the leaderboard</strong> with other professionals</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong style="color: #7c3aed; font-size: 18px; margin-right: 12px;">5.</strong>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>Review detailed analytics</strong> to identify areas for improvement</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 36px 0 24px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://regulatoryexams.co.za'}/dashboard" class="button" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 700; font-size: 17px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                  Go to Your Dashboard →
                </a>
              </div>

              <!-- Features Grid -->
              <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 12px; padding: 28px; margin: 32px 0;">
                <p style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 700;">💎 Your Premium Features:</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #2563eb; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">Comprehensive question bank with detailed explanations</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #7c3aed; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">Advanced performance analytics and progress tracking</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #db2777; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">Full-length timed mock exams</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #2563eb; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">Leaderboard rankings and community features</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #7c3aed; font-size: 20px; margin-right: 12px;">✓</span>
                      <span style="color: #374151; font-size: 15px; line-height: 1.6;">Personalized study recommendations</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Motivational Message -->
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%); border-radius: 12px; padding: 28px; margin: 32px 0; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #111827; font-size: 20px; font-weight: 700;">
                  "Success is the sum of small efforts repeated day in and day out."
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 15px;">
                  We're here to support you every step of the way. Let's ace that RE5 exam together!
                </p>
              </div>

              <p style="margin: 28px 0 0 0; color: #4b5563; font-size: 15px; line-height: 1.7; text-align: center;">
                Ready to begin? Head to your dashboard and start your first practice session.<br>
                <strong>Good luck with your studies, ${firstName}!</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 15px;">
                Questions or need support?<br>
                <a href="mailto:support@regulatoryexams.co.za" style="color: #7c3aed; text-decoration: none; font-weight: 600;">support@regulatoryexams.co.za</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                © ${new Date().getFullYear()} Regulatory Exams. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Welcome to Regulatory Exams!",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    await sesClient.send(command);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
    // Don't throw error for welcome email failure
  }
}

/**
 * Send goodbye email when user deletes their account
 */
export async function sendGoodbyeEmail(
  email: string,
  firstName?: string
): Promise<void> {
  const displayName = firstName || "there";
  const variables = {
    firstName: displayName,
    currentYear: new Date().getFullYear().toString(),
    supportEmail: 'support@regulatoryexams.co.za',
  };

  const fallbackHtmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We're Sad to See You Go - QuickBudget</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px !important; }
      .button { padding: 14px 28px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">

          <!-- QuickBudget Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 50px 40px; text-align: center;">
              <div style="background: rgba(255, 255, 255, 0.2); border-radius: 20px; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px; line-height: 1;">👋</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">We're Sad to See You Go</h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400;">Thank you for trusting us with your budget</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="content" style="padding: 50px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700;">Goodbye, ${displayName}</h2>
              <p style="margin: 0 0 28px 0; color: #4b5563; font-size: 17px; line-height: 1.7;">
                Your account has been successfully deleted as requested. We're sorry to see you go, and we want to thank you for choosing QuickBudget to help manage your finances.
              </p>

              <!-- Confirmation Card -->
              <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%); border-radius: 16px; padding: 32px; text-align: center; margin: 32px 0;">
                <span style="font-size: 56px; line-height: 1; display: block; margin-bottom: 16px;">✓</span>
                <p style="margin: 0 0 8px 0; color: #065f46; font-size: 20px; font-weight: 700;">Account Deleted Successfully</p>
                <p style="margin: 0; color: #047857; font-size: 15px;">All your budget data has been permanently removed from our systems</p>
              </div>

              <!-- Thank You Message -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 12px; padding: 28px; margin: 32px 0;">
                <p style="margin: 0 0 12px 0; color: #92400e; font-size: 20px; font-weight: 700;">💚 Thank You</p>
                <p style="margin: 0; color: #78350f; font-size: 16px; line-height: 1.7;">
                  Thank you for being part of the QuickBudget community. We hope our platform helped you take control of your finances and reach your financial goals. Your financial success has always been our priority.
                </p>
              </div>

              <!-- Feedback Request -->
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center;">
                <p style="margin: 0 0 16px 0; color: #111827; font-size: 22px; font-weight: 700;">We'd Love Your Feedback</p>
                <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">
                  Your feedback is incredibly valuable to us. It helps us improve and serve the South African budgeting community better. Would you mind sharing why you decided to leave?
                </p>

                <div style="background: #ffffff; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: left;">
                  <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Help us improve:</p>
                  <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 15px; line-height: 2;">
                    <li>What budgeting features were missing?</li>
                    <li>How could we make budgeting easier?</li>
                    <li>Was there anything that didn't meet your expectations?</li>
                    <li>Any suggestions for improvement?</li>
                  </ul>
                </div>

                <div style="text-align: center; margin: 28px 0;">
                  <a href="mailto:support@quickbudget.co.za?subject=Feedback%20on%20My%20Experience" class="button" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 700; font-size: 17px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                    Send Us Your Feedback
                  </a>
                </div>

                <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 14px;">
                  Or simply reply to this email with your thoughts
                </p>
              </div>

              <!-- Come Back Anytime -->
              <div style="background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%); border: 2px solid #10b981; border-radius: 12px; padding: 28px; margin: 32px 0; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #065f46; font-size: 20px; font-weight: 700;">The Door Is Always Open</p>
                <p style="margin: 0; color: #047857; font-size: 16px; line-height: 1.7;">
                  If you change your mind, you're always welcome back! Simply create a new account at <strong>www.quickbudget.co.za</strong>, and start your budgeting journey again. We'd be thrilled to help you manage your finances.
                </p>
              </div>

              <p style="margin: 32px 0 0 0; color: #4b5563; font-size: 15px; line-height: 1.7; text-align: center;">
                We wish you all the best with your financial goals and future success.<br>
                <strong style="color: #111827;">Thank you for being part of our journey.</strong>
              </p>

              <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 14px; text-align: center; font-style: italic;">
                — The QuickBudget Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #d1fae5;">
              <p style="margin: 0 0 12px 0; color: #047857; font-size: 15px;">
                Have questions or need assistance?<br>
                <a href="mailto:support@quickbudget.co.za" style="color: #10b981; text-decoration: none; font-weight: 600;">support@quickbudget.co.za</a>
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                © ${new Date().getFullYear()} QuickBudget SA. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const fallbackTextBody = `
Goodbye, ${displayName}

Your account has been successfully deleted as requested. We're sorry to see you go, and we want to thank you for choosing QuickBudget to help manage your finances.

✓ ACCOUNT DELETED SUCCESSFULLY
All your budget data has been permanently removed from our systems.

💚 THANK YOU
Thank you for being part of the QuickBudget community. We hope our platform helped you take control of your finances and reach your financial goals. Your financial success has always been our priority.

WE'D LOVE YOUR FEEDBACK
Your feedback is incredibly valuable to us. It helps us improve and serve the South African budgeting community better. Would you mind sharing why you decided to leave?

Help us improve:
- What budgeting features were missing?
- How could we make budgeting easier?
- Was there anything that didn't meet your expectations?
- Any suggestions for improvement?

Please send your feedback to: support@quickbudget.co.za

THE DOOR IS ALWAYS OPEN
If you change your mind, you're always welcome back! Simply create a new account at www.quickbudget.co.za, and start your budgeting journey again. We'd be thrilled to help you manage your finances.

We wish you all the best with your financial goals and future success.
Thank you for being part of our journey.

— The QuickBudget Team

Have questions or need assistance?
Email: support@quickbudget.co.za

© ${new Date().getFullYear()} QuickBudget SA. All rights reserved.
  `;

  const template = await getTemplate(
    'goodbye',
    variables,
    fallbackHtmlBody,
    fallbackTextBody,
    "We're Sad to See You Go - QuickBudget SA"
  );

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: template.subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: template.html,
          Charset: "UTF-8",
        },
        Text: {
          Data: template.text,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    console.log(`📧 Attempting to send goodbye email from ${FROM_EMAIL} to ${email}`);
    const result = await sesClient.send(command);
    console.log(`✅ Goodbye email sent successfully to ${email}`, { messageId: result.MessageId });
  } catch (error: any) {
    console.error(`❌ Failed to send goodbye email to ${email}`);
    console.error(`Error name: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error code: ${error.Code || error.$metadata?.httpStatusCode}`);
    console.error(`Full error:`, JSON.stringify(error, null, 2));
    // Don't throw error for goodbye email failure - account is already deleted
  }
}

/**
 * Send password reset email with verification code
 */
export async function sendPasswordResetEmail(
  email: string,
  code: string,
  firstName?: string
): Promise<void> {
  const displayName = firstName || "there";
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px !important; }
      .button { padding: 14px 28px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fdf2f8 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">

          <!-- Alert Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); padding: 50px 40px; text-align: center;">
              <div style="background: rgba(255, 255, 255, 0.2); border-radius: 20px; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px; line-height: 1;">🔐</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Password Reset Request</h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 400;">We received a request to reset your password</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="content" style="padding: 50px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700;">Hi ${displayName},</h2>
              <p style="margin: 0 0 28px 0; color: #4b5563; font-size: 17px; line-height: 1.7;">
                We received a request to reset the password for your Regulatory Exams account. Use the verification code below to set a new password.
              </p>

              <!-- Verification Code Card -->
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%); border: 3px solid transparent; background-clip: padding-box; border-radius: 16px; padding: 40px 30px; text-align: center; margin: 32px 0; position: relative;">
                <div style="position: absolute; top: -3px; left: -3px; right: -3px; bottom: -3px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); border-radius: 16px; z-index: -1;"></div>
                <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your Reset Code</p>
                <p style="margin: 0; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                  ${code}
                </p>
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">Valid for 15 minutes</p>
              </div>

              <!-- Instructions -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%); border-left: 4px solid #7c3aed; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <p style="margin: 0 0 12px 0; color: #111827; font-size: 18px; font-weight: 700;">📋 How to reset:</p>
                <ol style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 15px; line-height: 2;">
                  <li>Return to the password reset page</li>
                  <li>Enter the verification code above</li>
                  <li>Create your new password</li>
                  <li>Log in with your new credentials</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 36px 0 24px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://regulatoryexams.co.za'}/reset-password" class="button" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 700; font-size: 17px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                  Reset Password Now →
                </a>
              </div>

              <!-- Security Warning -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 16px; font-weight: 700;">⚠️ Security Notice</p>
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.7;">
                  If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account is secure.
                </p>
              </div>

              <p style="margin: 28px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6; text-align: center;">
                This verification code will expire in 15 minutes for security reasons.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 15px;">
                Need help with your account?<br>
                <a href="mailto:support@regulatoryexams.co.za" style="color: #7c3aed; text-decoration: none; font-weight: 600;">support@regulatoryexams.co.za</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                © ${new Date().getFullYear()} Regulatory Exams. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textBody = `
Password Reset Request

Hi ${displayName},

We received a request to reset the password for your Regulatory Exams account.

Your Reset Code: ${code}

This code is valid for 15 minutes.

How to reset:
1. Return to the password reset page
2. Enter the verification code above
3. Create your new password
4. Log in with your new credentials

If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account is secure.

Need help? Contact us at support@regulatoryexams.co.za

© ${new Date().getFullYear()} Regulatory Exams. All rights reserved.
  `;

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Reset Your Password - Regulatory Exams",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    await sesClient.send(command);
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error);
    throw error;
  }
}
