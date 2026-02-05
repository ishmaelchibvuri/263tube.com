/**
 * API Route: POST /api/creators/[slug]/contact
 *
 * Handles sponsorship/collaboration enquiry submissions from the creator profile page.
 * Stores the enquiry in DynamoDB for the creator to review in their dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  } : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);

const CREATORS_TABLE = process.env.DYNAMODB_CREATORS_TABLE || "263tube-creators";
const INQUIRIES_TABLE = process.env.DYNAMODB_INQUIRIES_TABLE || "263tube-inquiries";

interface ContactFormData {
  name: string;
  companyName?: string;
  email: string;
  interestType: string;
  subject: string;
  message: string;
  budget?: string;
  senderUserId?: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body: ContactFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: "Name, email, subject, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if creator exists
    const creatorResult = await docClient.send(
      new GetCommand({
        TableName: CREATORS_TABLE,
        Key: { slug },
      })
    );

    if (!creatorResult.Item) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Create inquiry record
    const inquiryId = uuidv4();
    const now = new Date().toISOString();

    const inquiry = {
      id: inquiryId,
      creatorSlug: slug,
      creatorId: creatorResult.Item.id,

      // Sender info
      sponsorName: body.name.trim(),
      companyName: body.companyName?.trim() || null,
      email: body.email.trim().toLowerCase(),
      senderUserId: body.senderUserId || null,

      // Inquiry details
      interestType: body.interestType || "other",
      subject: body.subject.trim(),
      message: body.message.trim(),
      budget: body.budget || null,

      // Status tracking
      status: "unread",

      // Timestamps
      createdAt: now,
      updatedAt: now,

      // For GSI querying by creator
      GSI1PK: `CREATOR#${slug}`,
      GSI1SK: `INQUIRY#${now}`,
    };

    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: INQUIRIES_TABLE,
        Item: inquiry,
      })
    );

    // TODO: Send email notification to creator about new inquiry
    // This would integrate with SES to notify the creator

    return NextResponse.json({
      success: true,
      message: "Enquiry sent successfully",
      inquiryId,
    });

  } catch (error) {
    console.error("Error submitting contact form:", error);
    return NextResponse.json(
      { error: "Failed to submit enquiry. Please try again." },
      { status: 500 }
    );
  }
}
