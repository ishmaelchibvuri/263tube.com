"use server";

/**
 * 263Tube - Business Inquiry Server Actions
 *
 * Server-side functions for handling business inquiries from brands/sponsors
 * to creators. Includes honeypot spam protection and cookie-based rate limiting.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-server";

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

const getTableName = (): string => {
  const env =
    process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.ENVIRONMENT || "dev";
  return process.env.DYNAMODB_TABLE_NAME || `263tube-${env}`;
};

// ============================================================================
// Types
// ============================================================================

export interface SubmitInquiryResult {
  success: boolean;
  message: string;
  creatorName?: string;
}

export interface Inquiry {
  pk: string;
  sk: string;
  creatorSlug: string;
  companyName: string;
  email: string;
  collaborationType: string;
  message: string;
  budget: string;
  status: "PENDING" | "CONTACTED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
}

export interface UpdateInquiryResult {
  success: boolean;
  message: string;
}

// ============================================================================
// Rate Limiting
// ============================================================================

const INQUIRY_COOKIE_PREFIX = "inq_count_";
const MAX_INQUIRIES_PER_HOUR = 3;

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Submit a business inquiry for a creator
 *
 * Features:
 * - Honeypot field for bot detection (hidden "website" field)
 * - Cookie-based rate limiting (max 3 per hour)
 * - DynamoDB storage with GSI for admin feed
 */
export async function submitBusinessInquiry(
  creatorSlug: string,
  formData: FormData
): Promise<SubmitInquiryResult> {
  // --- Honeypot check ---
  const honeypot = formData.get("website") as string;
  if (honeypot) {
    // Bot detected — silently "succeed" so bots think it worked
    return {
      success: true,
      message: "Your inquiry has been sent!",
      creatorName: creatorSlug,
    };
  }

  // --- Extract form fields ---
  const companyName = (formData.get("companyName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const collaborationType = (formData.get("collaborationType") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();
  const budget = (formData.get("budget") as string)?.trim() || "";

  // --- Validation ---
  if (!companyName || companyName.length === 0) {
    return { success: false, message: "Company name or your name is required" };
  }

  if (!email || email.length === 0) {
    return { success: false, message: "Contact email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "Invalid email format" };
  }

  if (!collaborationType || collaborationType.length === 0) {
    return { success: false, message: "Type of collaboration is required" };
  }

  if (!message || message.length === 0) {
    return { success: false, message: "Message details are required" };
  }

  if (message.length > 5000) {
    return { success: false, message: "Message is too long (max 5000 characters)" };
  }

  // --- Rate limiting (cookie-based) ---
  const cookieStore = await cookies();
  const cookieName = `${INQUIRY_COOKIE_PREFIX}${Date.now().toString(36).slice(0, 4)}`;

  // Count recent inquiry cookies
  const allCookies = cookieStore.getAll();
  const recentInquiryCookies = allCookies.filter((c) =>
    c.name.startsWith(INQUIRY_COOKIE_PREFIX)
  );

  if (recentInquiryCookies.length >= MAX_INQUIRIES_PER_HOUR) {
    return {
      success: false,
      message:
        "You've sent too many inquiries recently. Please wait a while before trying again.",
    };
  }

  // --- Sanitize slug ---
  const sanitizedSlug = creatorSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (!sanitizedSlug || sanitizedSlug.length === 0) {
    return { success: false, message: "Invalid creator" };
  }

  // --- Write to DynamoDB ---
  const tableName = getTableName();
  const now = new Date();
  const timestamp = now.toISOString();
  const uuid = `${now.getTime()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const item = {
      pk: `INQUIRY#${sanitizedSlug}`,
      sk: `INQUIRY#${timestamp}#${uuid}`,

      // GSI for admin feed: query all inquiries sorted by date
      gsi1pk: "INQUIRY#ALL",
      gsi1sk: timestamp,

      entityType: "INQUIRY",
      creatorSlug: sanitizedSlug,
      companyName,
      email: email.toLowerCase(),
      collaborationType,
      message,
      budget,
      status: "PENDING",

      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });

    await docClient.send(command);

    // Set rate-limiting cookie (1 hour expiry)
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    cookieStore.set(cookieName, "1", {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // Revalidate admin inquiries page
    revalidatePath("/admin/inquiries");

    return {
      success: true,
      message: "Your inquiry has been sent!",
      creatorName: sanitizedSlug,
    };
  } catch (error) {
    console.error("Error submitting business inquiry:", error);
    return {
      success: false,
      message: "Failed to send inquiry. Please try again.",
    };
  }
}

/**
 * Get all inquiries for admin feed (newest first)
 * Protected with requireAdmin()
 */
export async function getAllInquiries(limit: number = 50) {
  await requireAdmin();

  const tableName = getTableName();

  try {
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: {
        ":pk": "INQUIRY#ALL",
      },
      ScanIndexForward: false, // Newest first
      Limit: limit,
    });

    const response = await docClient.send(command);
    return { success: true, data: (response.Items || []) as Inquiry[] };
  } catch (error: any) {
    console.error("Error fetching inquiries:", error);

    if (
      error.message?.includes("UNAUTHORIZED") ||
      error.message?.includes("FORBIDDEN")
    ) {
      return { success: false, data: [] as Inquiry[] };
    }

    return { success: false, data: [] as Inquiry[] };
  }
}

/**
 * Update an inquiry status (admin action)
 * Used for "Mark Contacted" and "Close" buttons
 */
export async function updateInquiryStatus(
  pk: string,
  sk: string,
  newStatus: "CONTACTED" | "CLOSED"
): Promise<UpdateInquiryResult> {
  try {
    await requireAdmin();

    const tableName = getTableName();
    const now = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk },
      UpdateExpression: "SET #status = :status, updatedAt = :now",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": newStatus,
        ":now": now,
      },
      ConditionExpression: "attribute_exists(pk)",
    });

    await docClient.send(command);

    revalidatePath("/admin/inquiries");

    return {
      success: true,
      message: `Inquiry marked as ${newStatus.toLowerCase()}`,
    };
  } catch (error: any) {
    console.error("Error updating inquiry status:", error);

    if (
      error.message?.includes("UNAUTHORIZED") ||
      error.message?.includes("FORBIDDEN")
    ) {
      return {
        success: false,
        message: "You are not authorized to perform this action",
      };
    }

    return {
      success: false,
      message: "Failed to update inquiry status. Please try again.",
    };
  }
}
