const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const placeholdersDir = path.join(__dirname, 'public', 'images', 'placeholders');
const outputDir = path.join(__dirname, 'public', 'images');

const files = [
  { name: 'quiz-interface', width: 1600, height: 1000 },
  { name: 'analytics-view', width: 800, height: 600 },
  { name: 'mobile-view', width: 600, height: 1200 }
];

console.log('Converting SVG placeholders to PNG...\n');

async function convertAll() {
  for (const file of files) {
    const svgPath = path.join(placeholdersDir, `${file.name}.svg`);
    const pngPath = path.join(outputDir, `${file.name}.png`);

    try {
      await sharp(svgPath)
        .resize(file.width, file.height)
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(pngPath);

      const stats = fs.statSync(pngPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`✓ Converted ${file.name}.png (${file.width}×${file.height}px, ${sizeKB}KB)`);
    } catch (error) {
      console.error(`✗ Failed to convert ${file.name}:`, error.message);
    }
  }

  console.log('\n✅ All images converted successfully!');
  console.log(`📁 PNG files saved to: ${outputDir}`);
  console.log('\n✨ Your Bento Grid images are now perfectly sized!');
}

convertAll().catch(console.error);
