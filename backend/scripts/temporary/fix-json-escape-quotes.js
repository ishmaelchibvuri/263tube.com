const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "seed-re5-exam_premium_pro.json");
const outputFile = path.join(__dirname, "seed-re5-exam_premium_pro_fixed.json");

console.log("🔧 Fixing JSON - escaping quotes within strings...");
console.log(`📖 Reading from: ${inputFile}`);

let content = fs.readFileSync(inputFile, "utf8");

console.log(`📝 Original file size: ${content.length} characters`);

// Strategy: Process the file parsing JSON objects and fixing as we go
// We'll read line by line and reconstruct the JSON properly

let lines = content.split('\n');
let inString = false;
let inKey = false;
let result = [];
let fixCount = 0;

for (let lineNum = 0; lineNum < lines.length; lineNum++) {
  let line = lines[lineNum];
  let newLine = "";
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const prevChar = i > 0 ? line[i - 1] : "";
    const nextChar = i < line.length - 1 ? line[i + 1] : "";

    // Track if previous character was escape
    if (escaped) {
      newLine += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      newLine += char;
      escaped = true;
      continue;
    }

    // Handle quotes
    if (char === '"') {
      // Check if this quote is preceded by : or , (meaning it's starting a value)
      // or followed by : (meaning it's ending a key)
      const trimmedBefore = newLine.trim();
      const isAfterColon = trimmedBefore.endsWith(':');
      const isAfterComma = trimmedBefore.endsWith(',');
      const isAfterOpenBrace = trimmedBefore.endsWith('{');
      const isAfterOpenBracket = trimmedBefore.endsWith('[');

      // Look ahead for colon (key ending)
      let isBeforeColon = false;
      for (let j = i + 1; j < line.length; j++) {
        if (line[j] === ':') {
          isBeforeColon = true;
          break;
        }
        if (line[j] !== ' ' && line[j] !== '\t') {
          break;
        }
      }

      // If we're clearly at a structural position, toggle string state
      if (isAfterColon || isAfterComma || isAfterOpenBrace || isAfterOpenBracket || isBeforeColon || !inString) {
        newLine += char;
        if (isBeforeColon) {
          inKey = true;
          inString = true;
        } else if (isAfterColon) {
          inKey = false;
          inString = true;
        } else {
          inString = !inString;
        }
      } else {
        // We're inside a string value, escape this quote
        newLine += '\\"';
        fixCount++;
      }
    }
    // Replace smart quotes inside strings
    else if (inString && !inKey) {
      const code = char.charCodeAt(0);

      // Smart single quotes
      if (code === 0x2018 || code === 0x2019) {
        newLine += "'";
        fixCount++;
      }
      // Smart double quotes - replace with escaped quote or single quote
      else if (code === 0x201C || code === 0x201D) {
        newLine += "'";
        fixCount++;
      }
      // Em dash
      else if (code === 0x2014) {
        newLine += "-";
        fixCount++;
      }
      // En dash
      else if (code === 0x2013) {
        newLine += "-";
        fixCount++;
      }
      // Ellipsis
      else if (code === 0x2026) {
        newLine += "...";
        fixCount++;
      }
      else {
        newLine += char;
      }
    } else {
      newLine += char;
    }
  }

  result.push(newLine);
}

const fixed = result.join('\n');

console.log(`✅ Fixed ${fixCount} issues`);

// Try to parse
try {
  const parsed = JSON.parse(fixed);
  console.log(`✅ JSON is now valid! Found ${parsed.length} questions`);

  // Write formatted JSON
  fs.writeFileSync(outputFile, JSON.stringify(parsed, null, 2), "utf8");
  console.log(`💾 Saved fixed and formatted JSON to: ${outputFile}`);

  console.log("");
  console.log("🎉 Success!");
  console.log(`📊 Questions: ${parsed.length}`);
} catch (error) {
  console.error("❌ JSON is still invalid:", error.message);

  const match = error.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    console.log(`\n📍 Error at position ${pos}`);
    const context = fixed.substring(Math.max(0, pos - 100), Math.min(fixed.length, pos + 100));
    console.log(`\nContext:\n${context}`);
  }

  // Save anyway
  fs.writeFileSync(outputFile, fixed, "utf8");
  console.log(`\n💾 Saved partially fixed content to: ${outputFile}`);
}
