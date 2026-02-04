const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "seed-re5-exam_premium_pro.json");
const outputFile = path.join(__dirname, "seed-re5-exam_premium_pro_fixed.json");

console.log("🔧 Fixing JSON file - smart approach...");
console.log(`📖 Reading from: ${inputFile}`);

let content = fs.readFileSync(inputFile, "utf8");

console.log(`📝 Original file size: ${content.length} characters`);

// Strategy: Process the file character by character, tracking whether we're inside a string
let result = "";
let insideString = false;
let prevChar = "";
let fixCount = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i + 1] || "";

  // Check if we're entering or leaving a string (standard double quote)
  if (char === '"' && prevChar !== "\\") {
    insideString = !insideString;
    result += char;
  }
  // Replace smart quotes ONLY when inside a string
  else if (insideString) {
    const code = char.charCodeAt(0);

    // Smart single quotes (U+2018, U+2019)
    if (code === 0x2018 || code === 0x2019) {
      result += "'";
      fixCount++;
    }
    // Smart double quotes (U+201C, U+201D) - replace with single quote
    else if (code === 0x201C || code === 0x201D) {
      result += "'";
      fixCount++;
    }
    // Em dash (U+2014)
    else if (code === 0x2014) {
      result += "-";
      fixCount++;
    }
    // En dash (U+2013)
    else if (code === 0x2013) {
      result += "-";
      fixCount++;
    }
    // Ellipsis (U+2026)
    else if (code === 0x2026) {
      result += "...";
      fixCount++;
    }
    else {
      result += char;
    }
  }
  // Outside strings, keep everything as-is
  else {
    result += char;
  }

  prevChar = char;
}

console.log(`✅ Fixed ${fixCount} special characters inside strings`);

// Try to parse to verify it's valid JSON
try {
  const parsed = JSON.parse(result);
  console.log(`✅ JSON is now valid! Found ${parsed.length} questions`);

  // Write the fixed content
  fs.writeFileSync(outputFile, JSON.stringify(parsed, null, 2), "utf8");
  console.log(`💾 Saved fixed and formatted JSON to: ${outputFile}`);

  console.log("");
  console.log("🎉 Success! The JSON file has been fixed.");
  console.log(`📊 Questions: ${parsed.length}`);
  console.log(`📝 Sample question ID: ${parsed[0].ID}`);
  console.log(`📝 Sample question: ${parsed[0].Question_Stem.substring(0, 80)}...`);
} catch (error) {
  console.error("❌ JSON is still invalid:", error.message);

  // Try to find the error location
  const match = error.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    const linesBefore = result.substring(0, pos).split("\n");
    const lineNumber = linesBefore.length;

    console.log(`\n📍 Error at line ${lineNumber}, position ${pos}`);
    console.log(`\nContext (200 chars before and after):`);

    const start = Math.max(0, pos - 200);
    const end = Math.min(result.length, pos + 200);
    const context = result.substring(start, end);

    // Show context with line breaks preserved
    console.log("---START CONTEXT---");
    console.log(context);
    console.log("---END CONTEXT---");
    console.log(`\nThe error character at position ${pos} is: '${result[pos]}' (code: ${result.charCodeAt(pos)})`);
  }

  // Save the partially fixed content anyway
  fs.writeFileSync(outputFile, result, "utf8");
  console.log(`\n💾 Saved partially fixed content to: ${outputFile}`);
}
