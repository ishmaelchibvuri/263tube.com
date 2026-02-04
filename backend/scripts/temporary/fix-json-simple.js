const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "seed-re5-exam_premium_pro.json");
const outputFile = path.join(__dirname, "seed-re5-exam_premium_pro_fixed.json");

console.log("🔧 Simple JSON fix - escaping embedded quotes...");
console.log(`📖 Reading from: ${inputFile}`);

let content = fs.readFileSync(inputFile, "utf8");

console.log(`📝 Original file size: ${content.length} characters`);

// Use a regex to find "Explanation": "..." patterns and escape quotes within
// This regex matches: "Explanation": "...", capturing the content
const explanationRegex = /("Explanation":\s*")([^"]*(?:"[^"]*)*?)("(?:,|\s*\n))/g;

let fixCount = 0;

content = content.replace(explanationRegex, (match, prefix, content, suffix) => {
  // Escape any unescaped quotes in the content
  const fixed = content.replace(/"/g, '\\"');
  if (fixed !== content) {
    const count = (content.match(/"/g) || []).length;
    fixCount += count;
    console.log(`Fixed ${count} quotes in explanation: ${content.substring(0, 50)}...`);
  }
  return prefix + fixed + suffix;
});

// Do the same for other text fields that might have quotes
const fieldsToFix = [
  'Question_Stem',
  'Option_A',
  'Option_B',
  'Option_C',
  'Option_D',
  'Legislative_Anchor',
  'Task_Category',
  'Topic'
];

fieldsToFix.forEach(field => {
  const fieldRegex = new RegExp(`("${field}":\\s*")([^"]*(?:"[^"]*)*?)("(?:,|\\s*\\n))`, 'g');

  content = content.replace(fieldRegex, (match, prefix, content, suffix) => {
    const fixed = content.replace(/"/g, '\\"');
    if (fixed !== content) {
      const count = (content.match(/"/g) || []).length;
      fixCount += count;
    }
    return prefix + fixed + suffix;
  });
});

console.log(`✅ Fixed ${fixCount} embedded quotes`);

// Try to parse
try {
  const parsed = JSON.parse(content);
  console.log(`✅ JSON is now valid! Found ${parsed.length} questions`);

  // Write formatted JSON
  fs.writeFileSync(outputFile, JSON.stringify(parsed, null, 2), "utf8");
  console.log(`💾 Saved fixed and formatted JSON to: ${outputFile}`);

  console.log("");
  console.log("🎉 Success!");
  console.log(`📊 Questions: ${parsed.length}`);
  console.log(`📝 First question: ${parsed[0].Question_Stem.substring(0, 60)}...`);
} catch (error) {
  console.error("❌ JSON is still invalid:", error.message);

  const match = error.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    console.log(`\n📍 Error at position ${pos}`);
    const context = content.substring(Math.max(0, pos - 150), Math.min(content.length, pos + 150));
    console.log(`\nContext:\n${context}`);
    console.log(`\nCharacter at error: '${content[pos]}' (code: ${content.charCodeAt(pos)})`);
  }

  // Save anyway
  fs.writeFileSync(outputFile, content, "utf8");
  console.log(`\n💾 Saved partially fixed content to: ${outputFile}`);
}
