import { NextRequest, NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";

// In-memory store for verification codes (in production, use Redis or database)
// Using a Map with email -> { code, expiresAt, attempts }
const verificationCodes = new Map<string, { code: string; expiresAt: number; attempts: number }>();

// Rate limiting - max 3 codes per email per hour
const rateLimits = new Map<string, { count: number; resetAt: number }>();

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || "af-south-1",
});

// Generate a 6-digit code
function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Clean up expired codes periodically
function cleanupExpiredCodes() {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (data.expiresAt < now) {
      verificationCodes.delete(email);
    }
  }
  for (const [email, data] of rateLimits.entries()) {
    if (data.resetAt < now) {
      rateLimits.delete(email);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Clean up expired entries
    cleanupExpiredCodes();

    // Check rate limit
    const rateLimit = rateLimits.get(normalizedEmail);
    const now = Date.now();

    if (rateLimit && rateLimit.resetAt > now && rateLimit.count >= 3) {
      const minutesLeft = Math.ceil((rateLimit.resetAt - now) / 60000);
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${minutesLeft} minutes.` },
        { status: 429 }
      );
    }

    // Update rate limit
    if (!rateLimit || rateLimit.resetAt < now) {
      rateLimits.set(normalizedEmail, { count: 1, resetAt: now + 3600000 }); // 1 hour
    } else {
      rateLimits.set(normalizedEmail, { ...rateLimit, count: rateLimit.count + 1 });
    }

    // Generate new code
    const code = generateCode();
    const expiresAt = now + 600000; // 10 minutes

    // Store the code
    verificationCodes.set(normalizedEmail, {
      code,
      expiresAt,
      attempts: 0,
    });

    // Send email via SES
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #DE2010, #b01a0d); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; text-align: center; }
    .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #DE2010; background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: monospace; }
    .footer { padding: 20px 30px; background: #f9f9f9; font-size: 12px; color: #666; text-align: center; }
    .warning { color: #999; font-size: 11px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>263Tube Verification</h1>
    </div>
    <div class="content">
      <p>You're submitting a creator to 263Tube. Use the code below to verify your email address:</p>
      <div class="code">${code}</div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p class="warning">If you didn't request this code, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; 263Tube - Zimbabwe's Creator Directory</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const textBody = `
263Tube Verification Code

Your verification code is: ${code}

This code expires in 10 minutes.

If you didn't request this code, you can safely ignore this email.

- 263Tube
    `.trim();

    const sendEmailCommand = new SendEmailCommand({
      Source: `"263Tube" <noreply@263tube.com>`,
      Destination: {
        ToAddresses: [normalizedEmail],
      },
      Message: {
        Subject: {
          Data: `Your 263Tube verification code: ${code}`,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(sendEmailCommand);

    return NextResponse.json({
      success: true,
      message: "Verification code sent",
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return NextResponse.json(
      { error: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}

