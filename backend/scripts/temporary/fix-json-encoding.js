const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "seed-re5-exam_premium_pro.json");
const outputFile = path.join(__dirname, "seed-re5-exam_premium_pro_fixed.json");

console.log("🔧 Fixing JSON encoding issues...");
console.log(`📖 Reading from: ${inputFile}`);

let content = fs.readFileSync(inputFile, "utf8");

console.log(`📝 Original file size: ${content.length} characters`);

// Replace all types of smart quotes and special characters
// First, let's find and replace smart double quotes within string values only
// We need to be careful not to break the JSON structure

// Step 1: Replace smart quotes with regular quotes
const fixes = [
  { pattern: /[\u2018\u2019]/g, replacement: "'", name: "smart single quotes" },
  { pattern: /"/g, replacement: "'", name: "left double quote" },
  { pattern: /"/g, replacement: "'", name: "right double quote" },
  { pattern: /[\u201C\u201D]/g, replacement: "'", name: "other smart double quotes" },
  { pattern: /[\u2013\u2014]/g, replacement: "-", name: "em/en dashes" },
  { pattern: /[\u2026]/g, replacement: "...", name: "ellipsis" },
  { pattern: /[\u00A0]/g, replacement: " ", name: "non-breaking spaces" },
  { pattern: /[\u2010-\u2015]/g, replacement: "-", name: "various dashes" },
  { pattern: /[\u2032\u2033]/g, replacement: "'", name: "prime marks" },
];

let fixCount = 0;
fixes.forEach(({ pattern, replacement, name }) => {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`   Fixing ${matches.length} ${name}`);
    fixCount += matches.length;
    content = content.replace(pattern, replacement);
  }
});

console.log(`✅ Fixed ${fixCount} encoding issues`);

// Try to parse to verify it's valid JSON
try {
  const parsed = JSON.parse(content);
  console.log(`✅ JSON is now valid! Found ${parsed.length} questions`);

  // Write the fixed content
  fs.writeFileSync(outputFile, content, "utf8");
  console.log(`💾 Saved fixed JSON to: ${outputFile}`);

  console.log("");
  console.log("🎉 Success! You can now run the import script.");
} catch (error) {
  console.error("❌ JSON is still invalid:", error.message);

  // Save it anyway for debugging
  fs.writeFileSync(outputFile, content, "utf8");
  console.log(`💾 Saved partially fixed JSON to: ${outputFile}`);

  // Try to find the error location
  const match = error.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    const context = content.substring(Math.max(0, pos - 200), Math.min(content.length, pos + 200));
    console.log("\n📍 Error context:");
    console.log(context);
  }
}
