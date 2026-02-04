const fs = require('fs');

const content = fs.readFileSync('C:/Temp/apps/app.regulatoryexams.co.za/backend/scripts/seed-re5-exam_premium_pro.json', 'utf8');

// Check the area around the error
const pos = 652630;
console.log('Characters around position 652630:');
for (let i = pos; i < pos + 20; i++) {
  const char = content[i];
  const code = char.charCodeAt(0);
  console.log(`Position ${i}: '${char}' (U+${code.toString(16).toUpperCase().padStart(4, '0')}) - ${char === '"' ? 'QUOTE' : char === ' ' ? 'SPACE' : ''}`);
}

console.log('\n\nSearching for all smart double quotes in file:');
const smartQuotes = [];
for (let i = 0; i < content.length; i++) {
  const code = content[i].charCodeAt(0);
  if (code === 0x201C || code === 0x201D) {
    smartQuotes.push({ pos: i, char: content[i], code });
    if (smartQuotes.length <= 10) {
      const context = content.substring(Math.max(0, i - 30), Math.min(content.length, i + 30));
      console.log(`\nPosition ${i}: U+${code.toString(16).toUpperCase()}`);
      console.log(`Context: ...${context}...`);
    }
  }
}
console.log(`\nTotal smart double quotes found: ${smartQuotes.length}`);
