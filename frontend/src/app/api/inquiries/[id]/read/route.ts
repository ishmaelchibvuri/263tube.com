/**
 * API Route: POST /api/inquiries/[id]/read
 *
 * Marks a sponsorship enquiry as read.
 */

import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { cookies } from "next/headers";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  } : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);

const INQUIRIES_TABLE = process.env.DYNAMODB_INQUIRIES_TABLE || "263tube-inquiries";

/**
 * Extract user info from Cognito ID token in cookies
 */
async function getUserFromCookies(): Promise<{ isAuthenticated: boolean; role: string | null; creatorSlug: string | null }> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const idTokenCookie = allCookies.find(
      (cookie) =>
        cookie.name.includes("idToken") ||
        (cookie.name.includes("CognitoIdentityServiceProvider") &&
          cookie.name.includes("idToken"))
    );

    if (!idTokenCookie?.value) {
      return { isAuthenticated: false, role: null, creatorSlug: null };
    }

    const parts = idTokenCookie.value.split(".");
    if (parts.length !== 3) {
      return { isAuthenticated: false, role: null, creatorSlug: null };
    }

    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64").toString("utf-8")
    );

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { isAuthenticated: false, role: null, creatorSlug: null };
    }

    // Extract role
    let role = "user";
    if (payload["cognito:groups"]) {
      const groups = payload["cognito:groups"] as string[];
      if (groups.includes("admin") || groups.includes("admins")) {
        role = "admin";
      } else if (groups.includes("creator") || groups.includes("creators")) {
        role = "creator";
      }
    }

    if (role === "user" && payload["custom:role"]) {
      const customRole = payload["custom:role"].toLowerCase();
      if (["admin", "creator"].includes(customRole)) {
        role = customRole;
      }
    }

    // Extract creator slug
    const creatorSlug = payload["custom:creatorSlug"] || null;

    return { isAuthenticated: true, role, creatorSlug };
  } catch {
    return { isAuthenticated: false, role: null, creatorSlug: null };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isAuthenticated, role, creatorSlug } = await getUserFromCookies();

    // Check authentication
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the inquiry to check ownership
    const getResult = await docClient.send(
      new GetCommand({
        TableName: INQUIRIES_TABLE,
        Key: { id },
      })
    );

    if (!getResult.Item) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    // Check authorization: must be admin or the creator who owns this inquiry
    if (role !== "admin" && creatorSlug !== getResult.Item.creatorSlug) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Update the inquiry status
    await docClient.send(
      new UpdateCommand({
        TableName: INQUIRIES_TABLE,
        Key: { id },
        UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "read",
          ":updatedAt": new Date().toISOString(),
        },
      })
    );

    return NextResponse.json({
      success: true,
      message: "Inquiry marked as read",
    });

  } catch (error) {
    console.error("Error marking inquiry as read:", error);
    return NextResponse.json(
      { error: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}
