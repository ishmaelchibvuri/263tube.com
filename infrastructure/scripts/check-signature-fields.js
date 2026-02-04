#!/usr/bin/env node
/**
 * Check what fields are being included in PayFast signature calculation
 * This simulates exactly what the Lambda does
 */

const crypto = require('crypto');

// Your actual PayFast credentials
const MERCHANT_ID = '10032765';
const MERCHANT_KEY = 'sy3qzbaw99f4i';
const PASSPHRASE = 'CKosg7PsJkLES';

// Simulate what createPaymentData() returns
const paymentData = {
  // Merchant details (in order they appear in code)
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: 'http://localhost:3000/payment/success',
  cancel_url: 'http://localhost:3000/payment/cancelled',
  notify_url: 'https://1dxxnmcn4b.execute-api.af-south-1.amazonaws.com/dev/payment/webhook/payfast',

  // Buyer details
  name_first: 'Test',
  name_last: 'User',
  email_address: 'test@example.com',

  // Transaction details
  m_payment_id: 'test-purchase-123',
  amount: '179.99',
  item_name: 'Pro Subscription - 90 Days',
  item_description: 'Everything in Premium + exclusive materials, video explanations, exam simulation, advanced analytics',

  // Custom fields
  custom_str1: 'user-123',
  custom_str2: 'test-purchase-123',
  custom_str3: 'pro',

  // Email confirmation
  email_confirmation: '1',
  confirmation_address: 'test@example.com',
};

// This is EXACTLY what the generateSignature function does (lines 90-116 in payfast.ts)
function generateSignature(data, passphrase) {
  // Remove signature if it exists (line 92)
  const { signature, ...dataToSign } = data;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('FIELDS INCLUDED IN SIGNATURE (in order):');
  console.log('═══════════════════════════════════════════════════════════\n');

  const fields = [];

  // Build parameter string (lines 96-102)
  const paramString = Object.keys(dataToSign)
    .filter((key) => {
      const isIncluded = dataToSign[key] !== '' && dataToSign[key] !== undefined;
      const value = dataToSign[key];

      if (isIncluded) {
        fields.push({ key, value, encoded: encodeURIComponent(value.toString().trim()) });
        console.log(`✓ ${key.padEnd(25)} = ${value}`);
      } else {
        console.log(`✗ ${key.padEnd(25)} = (excluded - empty)`);
      }

      return isIncluded;
    })
    .map((key) => {
      const value = dataToSign[key];
      return `${key}=${encodeURIComponent(value.toString().trim())}`;
    })
    .join('&');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('PARAMETER STRING:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(paramString);

  // Add passphrase (lines 105-107)
  const stringToHash = passphrase
    ? `${paramString}&passphrase=${encodeURIComponent(passphrase)}`
    : paramString;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('FULL STRING TO HASH (with passphrase):');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(stringToHash);

  // Generate MD5 hash (line 112)
  const hash = crypto.createHash('md5').update(stringToHash).digest('hex');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('FINAL SIGNATURE:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(hash);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('SUMMARY:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Total fields included: ${fields.length}`);
  console.log(`Passphrase used: ${passphrase || '(none)'}`);
  console.log(`Signature: ${hash}`);

  return hash;
}

// Generate signature
const signature = generateSignature(paymentData, PASSPHRASE);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('WHAT TO CHECK:');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('1. Verify field order matches PayFast example');
console.log('2. Check if any unexpected fields are included');
console.log('3. Verify URL encoding is correct (spaces = %20, etc.)');
console.log('4. Confirm notify_url is using API Gateway (not localhost)');
console.log('5. Ensure passphrase matches PayFast settings');
console.log('\n═══════════════════════════════════════════════════════════\n');
