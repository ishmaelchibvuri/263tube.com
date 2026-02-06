"use server";

/**
 * 263Tube - Guest Email Verification Server Actions
 *
 * DynamoDB-backed email verification for guest submissions.
 * Replaces in-memory API routes with persistent storage.
 *
 * DynamoDB items:
 * - Verification code: PK=VERIFY#{email}, SK=CODE
 * - Rate limit: PK=RATE_LIMIT#EMAIL_VERIFY#{email}, SK=COUNTER
 */

import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "af-south-1",
});

const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
  },
});

const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || "af-south-1",
});

const getTableName = (): string => {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.ENVIRONMENT || "dev";
  return process.env.DYNAMODB_TABLE_NAME || `263tube-${env}`;
};

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export interface SendCodeResult {
  success: boolean;
  message: string;
  expiresIn?: number;
  error?: string;
}

export interface VerifyCodeResult {
  success: boolean;
  message: string;
  error?: string;
  attemptsRemaining?: number;
}

/**
 * Send a 6-digit verification code to the given email via SES.
 * Rate limited to 3 codes per email per hour.
 * Codes are stored in DynamoDB with a 10-minute TTL.
 */
export async function sendVerificationCode(email: string): Promise<SendCodeResult> {
  if (!email || !email.includes("@")) {
    return { success: false, message: "Valid email is required", error: "Valid email is required" };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const tableName = getTableName();
  const now = Math.floor(Date.now() / 1000);

  try {
    // Check rate limit
    const rateLimitKey = {
      pk: `RATE_LIMIT#EMAIL_VERIFY#${normalizedEmail}`,
      sk: "COUNTER",
    };

    const rateLimitResult = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: rateLimitKey,
    }));

    const rateLimit = rateLimitResult.Item;
    if (rateLimit && rateLimit.ttl > now && rateLimit.count >= 3) {
      const minutesLeft = Math.ceil((rateLimit.ttl - now) / 60);
      return {
        success: false,
        message: `Too many requests. Please try again in ${minutesLeft} minutes.`,
        error: `Too many requests. Please try again in ${minutesLeft} minutes.`,
      };
    }

    // Update rate limit counter
    if (!rateLimit || rateLimit.ttl <= now) {
      // New window
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: {
          ...rateLimitKey,
          count: 1,
          ttl: now + 3600, // 1 hour
          createdAt: new Date().toISOString(),
        },
      }));
    } else {
      // Increment existing
      await docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: rateLimitKey,
        UpdateExpression: "SET #c = #c + :inc",
        ExpressionAttributeNames: { "#c": "count" },
        ExpressionAttributeValues: { ":inc": 1 },
      }));
    }

    // Generate and store code
    const code = generateCode();
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        pk: `VERIFY#${normalizedEmail}`,
        sk: "CODE",
        code,
        attempts: 0,
        createdAt: new Date().toISOString(),
        ttl: now + 600, // 10 minutes
      },
    }));

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
</html>`.trim();

    const textBody = `263Tube Verification Code\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.\n\n- 263Tube`;

    await sesClient.send(new SendEmailCommand({
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
          Text: { Data: textBody, Charset: "UTF-8" },
          Html: { Data: htmlBody, Charset: "UTF-8" },
        },
      },
    }));

    return {
      success: true,
      message: "Verification code sent",
      expiresIn: 600,
    };
  } catch (error) {
    console.error("Error sending verification code:", error);
    return {
      success: false,
      message: "Failed to send verification code. Please try again.",
      error: "Failed to send verification code. Please try again.",
    };
  }
}

/**
 * Verify a 6-digit code for the given email.
 * Max 5 attempts per code.
 */
export async function verifyCode(email: string, code: string): Promise<VerifyCodeResult> {
  if (!email || !code || code.length !== 6) {
    return { success: false, message: "Invalid request", error: "Please enter the 6-digit code" };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const tableName = getTableName();
  const now = Math.floor(Date.now() / 1000);

  try {
    const key = {
      pk: `VERIFY#${normalizedEmail}`,
      sk: "CODE",
    };

    const result = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: key,
    }));

    const item = result.Item;
    if (!item) {
      return {
        success: false,
        message: "No verification code found. Please request a new one.",
        error: "No verification code found. Please request a new one.",
      };
    }

    // Check expiration
    if (item.ttl <= now) {
      return {
        success: false,
        message: "Verification code has expired. Please request a new one.",
        error: "Verification code has expired. Please request a new one.",
      };
    }

    // Check attempts
    if (item.attempts >= 5) {
      return {
        success: false,
        message: "Too many attempts. Please request a new code.",
        error: "Too many attempts. Please request a new code.",
        attemptsRemaining: 0,
      };
    }

    // Increment attempts
    await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: "SET attempts = attempts + :inc",
      ExpressionAttributeValues: { ":inc": 1 },
    }));

    // Check code
    if (item.code !== code) {
      const remaining = 4 - item.attempts;
      return {
        success: false,
        message: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
        error: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
        attemptsRemaining: remaining,
      };
    }

    return {
      success: true,
      message: "Email verified successfully",
    };
  } catch (error) {
    console.error("Error verifying code:", error);
    return {
      success: false,
      message: "Failed to verify code. Please try again.",
      error: "Failed to verify code. Please try again.",
    };
  }
}
