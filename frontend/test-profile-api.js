/**
 * Test script to check what the /auth/profile API actually returns
 * This will help us see if the issue is the API or the frontend
 */

// Run this after logging in and paste your access token
const TEST_TOKEN = process.argv[2];

if (!TEST_TOKEN) {
  console.log("❌ Usage: node test-profile-api.js <your-auth-token>");
  console.log("\nTo get your token:");
  console.log("1. Open DevTools (F12)");
  console.log("2. Go to Application > Local Storage > http://localhost:3000");
  console.log("3. Look for a key containing 'idToken' or 'accessToken'");
  console.log("4. Copy the token value");
  console.log("5. Run: node test-profile-api.js YOUR_TOKEN_HERE");
  process.exit(1);
}

const API_URL = "https://snpfsl3dtg.execute-api.af-south-1.amazonaws.com/dev/auth/profile";

async function testProfileAPI() {
  console.log("========================================");
  console.log("Testing /auth/profile API");
  console.log("========================================\n");
  console.log("API URL:", API_URL);
  console.log("Token (first 20 chars):", TEST_TOKEN.substring(0, 20) + "...");
  console.log("\nSending request...\n");

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${TEST_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Response Status:", response.status);
    console.log("Response Status Text:", response.statusText);
    console.log("\nResponse Headers:");
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const data = await response.json();

    console.log("\n========================================");
    console.log("RESPONSE DATA:");
    console.log("========================================");
    console.log(JSON.stringify(data, null, 2));

    if (data.userId) {
      console.log("\n========================================");
      console.log("KEY FIELDS:");
      console.log("========================================");
      console.log("User ID:", data.userId);
      console.log("Email:", data.email);
      console.log("Name:", data.firstName, data.lastName);
      console.log("ROLE:", data.role);
      console.log("isAdmin:", data.isAdmin);
      console.log("========================================");

      if (data.role !== "admin") {
        console.log("\n⚠️  WARNING: Role is NOT 'admin'");
        console.log("Expected: 'admin'");
        console.log("Received:", data.role);
      } else {
        console.log("\n✅ SUCCESS: Role is correctly set to 'admin'");
      }
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

testProfileAPI();
