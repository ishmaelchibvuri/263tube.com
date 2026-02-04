import * as crypto from "crypto";
import { SubscriptionTier } from "./types";

/**
 * PayFast Integration Utilities
 *
 * This module handles PayFast payment integration for South African Rand (ZAR) payments.
 * Includes signature generation, verification, and payment form data creation.
 *
 * PayFast Documentation: https://developers.payfast.co.za/
 */

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  mode: "sandbox" | "production";
}

export interface PaymentData {
  // Merchant details
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;

  // Buyer details
  name_first: string;
  name_last: string;
  email_address: string;

  // Transaction details
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description: string;

  // Custom fields
  custom_str1?: string; // userId
  custom_str2?: string; // purchaseId
  custom_str3?: string; // tier
  custom_str4?: string;
  custom_str5?: string;

  // Email confirmation
  email_confirmation?: string;
  confirmation_address?: string;

  // Signature (generated)
  signature?: string;
}

export class PayFast {
  private config: PayFastConfig;

  constructor(config?: Partial<PayFastConfig>) {
    this.config = {
      merchantId:
        config?.merchantId || process.env.PAYFAST_MERCHANT_ID || "10000100",
      merchantKey:
        config?.merchantKey ||
        process.env.PAYFAST_MERCHANT_KEY ||
        "46f0cd694581a",
      passphrase:
        config?.passphrase ||
        process.env.PAYFAST_PASSPHRASE ||
        "jt7NOE43FZPn",
      mode: (config?.mode || process.env.PAYFAST_MODE || "sandbox") as
        | "sandbox"
        | "production",
    };
  }

  /**
   * Get PayFast payment URL based on mode
   */
  getPaymentUrl(): string {
    if (this.config.mode === "production") {
      return "https://www.payfast.co.za/eng/process";
    }
    return "https://sandbox.payfast.co.za/eng/process";
  }

  /**
   * Custom URL encoder for PayFast compliance
   * PayFast requires:
   * 1. Spaces encoded as + (not %20)
   * 2. Hex sequences in UPPERCASE (%2F not %2f) - only the hex, not the content
   */
  private payfastUrlEncode(str: string): string {
    // Standard encoding first
    let encoded = encodeURIComponent(str);

    // Replace %20 with + (PayFast requirement)
    encoded = encoded.replace(/%20/g, '+');

    // Convert HEX sequences to uppercase (e.g., %2f → %2F)
    // Match %xx pattern and uppercase only the hex part
    encoded = encoded.replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase());

    return encoded;
  }

  /**
   * Generate MD5 signature for PayFast
   * Fields must be in the order they appear in the data object (NOT alphabetical)
   * As per PayFast docs: "Do not use the API signature format, which uses alphabetical ordering!"
   */
  generateSignature(data: Record<string, any>, passphrase?: string): string {
    // Remove signature if it exists
    const { signature, ...dataToSign } = data;

    // Create parameter string (exclude empty values)
    // IMPORTANT: Do NOT sort - preserve insertion order as per PayFast requirements
    const paramString = Object.keys(dataToSign)
      .filter((key) => {
        const value = dataToSign[key];
        // Filter out blank/empty values completely
        return value !== "" && value !== undefined && value !== null && String(value).trim() !== "";
      })
      .map((key) => {
        const value = dataToSign[key];
        // Use custom PayFast URL encoder
        return `${key}=${this.payfastUrlEncode(value.toString().trim())}`;
      })
      .join("&");

    // Add passphrase if provided (also using custom encoder)
    const stringToHash = passphrase
      ? `${paramString}&passphrase=${this.payfastUrlEncode(passphrase)}`
      : paramString;

    console.log("PayFast signature string:", stringToHash);

    // Generate MD5 hash (lowercase hex output)
    const hash = crypto.createHash("md5").update(stringToHash).digest("hex").toLowerCase();

    console.log("PayFast signature:", hash);

    return hash;
  }

  /**
   * Verify PayFast signature from ITN (Instant Transaction Notification)
   */
  verifySignature(data: Record<string, any>, receivedSignature: string): boolean {
    const calculatedSignature = this.generateSignature(
      data,
      this.config.passphrase
    );

    const isValid = calculatedSignature === receivedSignature;

    console.log("Signature verification:", {
      received: receivedSignature,
      calculated: calculatedSignature,
      isValid,
    });

    return isValid;
  }

  /**
   * Verify PayFast signature from raw URL-encoded body
   * This is used for ITN verification where we need to verify the signature
   * on the exact encoded data that PayFast sent
   */
  verifySignatureFromRawBody(rawBody: string, receivedSignature: string): boolean {
    // Parse the raw body to extract signature and build string for verification
    const params: string[] = [];

    rawBody.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      // Include all fields except signature, even if value is empty
      // PayFast includes empty fields in signature calculation
      if (key && key !== "signature") {
        params.push(`${key}=${value || ""}`);
      }
    });

    // Add passphrase
    const stringToHash = `${params.join("&")}&passphrase=${this.payfastUrlEncode(this.config.passphrase)}`;

    console.log("Raw signature verification string:", stringToHash);

    const calculatedSignature = require("crypto")
      .createHash("md5")
      .update(stringToHash)
      .digest("hex")
      .toLowerCase();

    const isValid = calculatedSignature === receivedSignature;

    console.log("Raw signature verification:", {
      received: receivedSignature,
      calculated: calculatedSignature,
      isValid,
    });

    return isValid;
  }

  /**
   * Create payment data for PayFast checkout
   */
  createPaymentData(params: {
    userId: string;
    purchaseId: string;
    tier: Exclude<SubscriptionTier, "free">;
    amount: number;
    firstName: string;
    lastName: string;
    email: string;
    returnUrl: string;
    cancelUrl: string;
    notifyUrl: string;
  }): PaymentData {
    const itemNames: Record<SubscriptionTier, string> = {
      [SubscriptionTier.GUEST]: "Guest Account", // Guests don't purchase - this is a fallback
      [SubscriptionTier.FREE]: "Free Account", // Free users don't purchase - this is a fallback
      [SubscriptionTier.PREMIUM]: "Premium Subscription - 30 Days",
      [SubscriptionTier.PRO]: "Pro Subscription - 90 Days",
    };

    const itemDescriptions: Record<SubscriptionTier, string> = {
      [SubscriptionTier.GUEST]: "Guest account - activate to upgrade", // Guests don't purchase
      [SubscriptionTier.FREE]: "Free account - upgrade for more features", // Free users don't purchase
      [SubscriptionTier.PREMIUM]:
        "Unlimited questions, all practice tests, all study materials, performance tracking",
      [SubscriptionTier.PRO]: "Everything in Premium + exclusive materials, video explanations, exam simulation, advanced analytics",
    };

    // Format amount to 2 decimal places
    const formattedAmount = (params.amount / 100).toFixed(2);

    const paymentData: PaymentData = {
      // Merchant details
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      notify_url: params.notifyUrl,

      // Buyer details
      name_first: params.firstName,
      name_last: params.lastName,
      email_address: params.email,

      // Transaction details
      m_payment_id: params.purchaseId,
      amount: formattedAmount,
      item_name: itemNames[params.tier],
      item_description: itemDescriptions[params.tier],

      // Custom fields for our use
      // NOTE: custom_str1 and custom_str2 removed - PayFast only accepts alphanumeric (no hyphens)
      // We use m_payment_id for purchaseId tracking instead
      custom_str3: params.tier,

      // Email confirmation (must be included for signature to match)
      email_confirmation: "1",
      confirmation_address: params.email,
    };

    // Generate signature
    paymentData.signature = this.generateSignature(
      paymentData,
      this.config.passphrase
    );

    return paymentData;
  }

  /**
   * Validate PayFast server IPs (for production security)
   * Only allow ITN from PayFast servers
   */
  isValidPayFastIP(ip: string): boolean {
    const validIPs = [
      "197.97.145.144",
      "197.97.145.145",
      "197.97.145.146",
      "197.97.145.147",
      "197.97.145.148",
      "197.97.145.149",
      // Sandbox IPs
      "41.74.179.194",
      "41.74.179.195",
      "41.74.179.196",
      "41.74.179.197",
      "41.74.179.198",
      "41.74.179.199",
    ];

    return validIPs.includes(ip);
  }

  /**
   * Parse PayFast ITN data
   * PayFast sends data with spaces encoded as + (not %20)
   */
  parseITNData(body: string): Record<string, string> {
    const data: Record<string, string> = {};

    body.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key && value) {
        // Replace + with spaces (PayFast uses + for spaces)
        // Then decode the rest with decodeURIComponent
        data[key] = decodeURIComponent(value.replace(/\+/g, ' '));
      }
    });

    return data;
  }

  /**
   * Verify payment status from PayFast
   * Returns true if payment is complete
   */
  isPaymentComplete(paymentStatus: string): boolean {
    return paymentStatus === "COMPLETE";
  }

  /**
   * Get amount in cents from PayFast amount string
   */
  getAmountInCents(amountString: string): number {
    return Math.round(parseFloat(amountString) * 100);
  }

  /**
   * Validate ITN (Instant Transaction Notification) from PayFast
   * Comprehensive validation including signature, IP, and amount
   */
  async validateITN(params: {
    data: Record<string, any>;
    sourceIP: string;
    expectedAmount: number;
  }): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // 1. Verify signature
    const receivedSignature = params.data.signature;
    if (!receivedSignature) {
      errors.push("Missing signature");
    } else {
      const isValidSignature = this.verifySignature(
        params.data,
        receivedSignature
      );
      if (!isValidSignature) {
        errors.push("Invalid signature");
      }
    }

    // 2. Verify source IP (only in production)
    if (this.config.mode === "production") {
      if (!this.isValidPayFastIP(params.sourceIP)) {
        errors.push(`Invalid source IP: ${params.sourceIP}`);
      }
    }

    // 3. Verify amount
    const receivedAmount = this.getAmountInCents(params.data.amount_gross);
    if (receivedAmount !== params.expectedAmount) {
      errors.push(
        `Amount mismatch: expected ${params.expectedAmount}, got ${receivedAmount}`
      );
    }

    // 4. Verify payment status
    if (!this.isPaymentComplete(params.data.payment_status)) {
      errors.push(
        `Payment not complete: ${params.data.payment_status}`
      );
    }

    // 5. Verify merchant ID
    if (params.data.merchant_id !== this.config.merchantId) {
      errors.push(
        `Merchant ID mismatch: expected ${this.config.merchantId}, got ${params.data.merchant_id}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create HTML form for PayFast payment
   * Use this for server-side redirects
   */
  createPaymentForm(paymentData: PaymentData): string {
    const fields = Object.entries(paymentData)
      .map(([key, value]) => {
        if (value !== undefined && value !== "") {
          return `<input type="hidden" name="${key}" value="${value}" />`;
        }
        return "";
      })
      .join("\n");

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Redirecting to PayFast...</title>
</head>
<body>
  <p>Redirecting to PayFast payment gateway...</p>
  <form id="payfast-form" action="${this.getPaymentUrl()}" method="POST">
    ${fields}
  </form>
  <script>
    document.getElementById('payfast-form').submit();
  </script>
</body>
</html>
    `.trim();
  }
}

/**
 * Default PayFast instance using environment variables
 */
export const payfast = new PayFast();

/**
 * Helper function to generate payment URL with query params
 * (Alternative to form POST)
 */
export function generatePaymentUrl(paymentData: PaymentData): string {
  const payfastUrl =
    process.env.PAYFAST_MODE === "production"
      ? "https://www.payfast.co.za/eng/process"
      : "https://sandbox.payfast.co.za/eng/process";

  const queryString = Object.entries(paymentData)
    .filter(([_, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(value!.toString())}`)
    .join("&");

  return `${payfastUrl}?${queryString}`;
}
