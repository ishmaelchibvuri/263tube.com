import { NextRequest, NextResponse } from "next/server";

// In-memory store for verification codes (shared with send-code route in same process)
// In production, use Redis or database for cross-instance sharing
const verificationCodes = new Map<string, { code: string; expiresAt: number; attempts: number }>();

// Track verified emails (valid for 30 minutes after verification)
const verifiedEmails = new Map<string, { verifiedAt: number; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "6-digit code is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.trim();

    // Get stored code data
    const storedData = verificationCodes.get(normalizedEmail);

    if (!storedData) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    // Check if expired
    if (storedData.expiresAt < Date.now()) {
      verificationCodes.delete(normalizedEmail);
      return NextResponse.json(
        { error: "Code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Check attempts (max 5 attempts)
    if (storedData.attempts >= 5) {
      verificationCodes.delete(normalizedEmail);
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new code." },
        { status: 400 }
      );
    }

    // Increment attempts
    verificationCodes.set(normalizedEmail, {
      ...storedData,
      attempts: storedData.attempts + 1,
    });

    // Verify the code
    if (storedData.code !== normalizedCode) {
      const attemptsLeft = 5 - storedData.attempts - 1;
      return NextResponse.json(
        { error: `Invalid code. ${attemptsLeft} attempts remaining.` },
        { status: 400 }
      );
    }

    // Code is valid - mark email as verified
    const now = Date.now();
    verifiedEmails.set(normalizedEmail, {
      verifiedAt: now,
      expiresAt: now + 1800000, // Valid for 30 minutes
    });

    // Remove the used code
    verificationCodes.delete(normalizedEmail);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      email: normalizedEmail,
      validUntil: new Date(now + 1800000).toISOString(),
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { error: "Failed to verify code. Please try again." },
      { status: 500 }
    );
  }
}

// Check if email is verified (for use by other routes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const verifiedData = verifiedEmails.get(normalizedEmail);

    if (!verifiedData || verifiedData.expiresAt < Date.now()) {
      verifiedEmails.delete(normalizedEmail);
      return NextResponse.json({
        verified: false,
      });
    }

    return NextResponse.json({
      verified: true,
      verifiedAt: new Date(verifiedData.verifiedAt).toISOString(),
      validUntil: new Date(verifiedData.expiresAt).toISOString(),
    });
  } catch (error) {
    console.error("Error checking verification status:", error);
    return NextResponse.json(
      { error: "Failed to check verification status" },
      { status: 500 }
    );
  }
}

