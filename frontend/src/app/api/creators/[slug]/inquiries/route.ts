/**
 * API Route: GET /api/creators/[slug]/inquiries
 *
 * Fetches all sponsorship enquiries for a creator.
 * Only accessible by the creator themselves or admins.
 */

import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { isAuthenticated, role, creatorSlug } = await getUserFromCookies();

    // Check authentication
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check authorization: must be admin or the creator themselves
    if (role !== "admin" && creatorSlug !== slug) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Query inquiries for this creator
    const result = await docClient.send(
      new QueryCommand({
        TableName: INQUIRIES_TABLE,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `CREATOR#${slug}`,
        },
        ScanIndexForward: false, // Most recent first
      })
    );

    const inquiries = (result.Items || []).map((item) => ({
      id: item.id,
      sponsorName: item.sponsorName,
      companyName: item.companyName,
      email: item.email,
      interestType: item.interestType,
      subject: item.subject,
      message: item.message,
      budget: item.budget,
      status: item.status,
      createdAt: item.createdAt,
    }));

    return NextResponse.json({
      inquiries,
      total: inquiries.length,
    });

  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}
