const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "seed-re5-exam_premium_pro.json");
const outputFile = path.join(__dirname, "seed-re5-exam_premium_pro_fixed.json");

console.log("🔧 Fixing smart quotes in JSON file...");
console.log(`📖 Reading from: ${inputFile}`);

let content = fs.readFileSync(inputFile, "utf8");

console.log(`📝 Original file size: ${content.length} characters`);

// Replace smart quotes that appear INSIDE string values
// The strategy: Parse line by line and fix content within quoted strings

// These are the problematic characters
const replacements = [
  // Smart single quotes
  { from: /'/g, to: "'" },
  { from: /'/g, to: "'" },
  // Smart double quotes - replace with escaped quotes or single quotes
  { from: /"/g, to: "'" },
  { from: /"/g, to: "'" },
  // Em and en dashes
  { from: /—/g, to: "-" },
  { from: /–/g, to: "-" },
  // Ellipsis
  { from: /…/g, to: "..." },
];

let fixCount = 0;

// Apply all replacements
replacements.forEach(({ from, to }) => {
  const matches = content.match(from);
  if (matches) {
    fixCount += matches.length;
    content = content.replace(from, to);
  }
});

console.log(`✅ Fixed ${fixCount} special characters`);

// Try to parse to verify it's valid JSON
try {
  const parsed = JSON.parse(content);
  console.log(`✅ JSON is now valid! Found ${parsed.length} questions`);

  // Write the fixed content
  fs.writeFileSync(outputFile, JSON.stringify(parsed, null, 2), "utf8");
  console.log(`💾 Saved fixed and formatted JSON to: ${outputFile}`);

  console.log("");
  console.log("🎉 Success! The JSON file has been fixed.");
  console.log(`📊 Questions: ${parsed.length}`);
  console.log(`📝 Sample question: ${parsed[0].Question_Stem.substring(0, 80)}...`);
} catch (error) {
  console.error("❌ JSON is still invalid:", error.message);

  // Try to find the error location
  const match = error.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    const linesBefore = content.substring(0, pos).split("\n");
    const lineNumber = linesBefore.length;

    console.log(`\n📍 Error at line ${lineNumber}, position ${pos}`);
    console.log(`\nContext (50 chars before and after):`);

    const start = Math.max(0, pos - 50);
    const end = Math.min(content.length, pos + 50);
    const context = content.substring(start, end);

    // Highlight the error position
    const relativePos = pos - start;
    console.log(context.substring(0, relativePos) + "<<<ERROR>>>" + context.substring(relativePos));
  }

  // Save the partially fixed content anyway
  fs.writeFileSync(outputFile, content, "utf8");
  console.log(`\n💾 Saved partially fixed content to: ${outputFile}`);
}
