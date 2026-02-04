const fs = require('fs');
const path = require('path');

// Function to create an SVG placeholder and convert it
function generatePlaceholder(name, width, height, bgColor, textColor, title, subtitle) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bgColor}dd;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#grad-${name})"/>

  <!-- Grid pattern -->
  <defs>
    <pattern id="grid-${name}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="0.5" opacity="0.1"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grid-${name})"/>

  <!-- Content area with mock UI elements -->
  ${name === 'quiz-interface' ? `
    <!-- Mock browser header -->
    <rect x="40" y="40" width="${width-80}" height="60" rx="8" fill="white" opacity="0.95"/>
    <circle cx="70" cy="70" r="8" fill="#FF5F57"/>
    <circle cx="100" cy="70" r="8" fill="#FFBD2E"/>
    <circle cx="130" cy="70" r="8" fill="#28CA42"/>

    <!-- Mock question card -->
    <rect x="40" y="120" width="${width-80}" height="${height-180}" rx="12" fill="white" opacity="0.95"/>

    <!-- Mock progress bar -->
    <rect x="60" y="140" width="${width-120}" height="8" rx="4" fill="#E5E7EB"/>
    <rect x="60" y="140" width="${(width-120)*0.6}" height="8" rx="4" fill="#3B82F6"/>

    <!-- Mock question text -->
    <rect x="60" y="170" width="${width-200}" height="20" rx="4" fill="#1F2937" opacity="0.8"/>
    <rect x="60" y="200" width="${width-150}" height="20" rx="4" fill="#1F2937" opacity="0.6"/>
    <rect x="60" y="230" width="${width-250}" height="20" rx="4" fill="#1F2937" opacity="0.4"/>

    <!-- Mock answer options -->
    <rect x="60" y="280" width="${width-120}" height="50" rx="8" fill="#F3F4F6" stroke="#3B82F6" stroke-width="2"/>
    <rect x="60" y="345" width="${width-120}" height="50" rx="8" fill="#F3F4F6"/>
    <rect x="60" y="410" width="${width-120}" height="50" rx="8" fill="#F3F4F6"/>
    <rect x="60" y="475" width="${width-120}" height="50" rx="8" fill="#F3F4F6"/>
  ` : ''}

  ${name === 'analytics-view' ? `
    <!-- Mock chart -->
    <rect x="20" y="20" width="${width-40}" height="${height-60}" rx="6" fill="white" opacity="0.9"/>

    <!-- Mock bar chart -->
    <rect x="30" y="${height-120}" width="20" height="80" rx="3" fill="#3B82F6" opacity="0.8"/>
    <rect x="60" y="${height-90}" width="20" height="50" rx="3" fill="#8B5CF6" opacity="0.8"/>
    <rect x="90" y="${height-100}" width="20" height="60" rx="3" fill="#EC4899" opacity="0.8"/>
    <rect x="120" y="${height-75}" width="20" height="35" rx="3" fill="#10B981" opacity="0.8"/>

    <!-- Mock stats -->
    <circle cx="35" cy="35" r="15" fill="#3B82F6" opacity="0.2"/>
    <text x="35" y="42" font-family="Arial" font-size="14" fill="#3B82F6" text-anchor="middle" font-weight="bold">85%</text>
  ` : ''}

  ${name === 'mobile-view' ? `
    <!-- Mock phone frame -->
    <rect x="${width*0.15}" y="20" width="${width*0.7}" height="${height-40}" rx="20" fill="white" opacity="0.95" stroke="#1F2937" stroke-width="8"/>

    <!-- Mock notch -->
    <rect x="${width*0.4}" y="20" width="${width*0.2}" height="20" rx="10" fill="#1F2937"/>

    <!-- Mock screen content -->
    <rect x="${width*0.15+20}" y="60" width="${width*0.7-40}" height="40" rx="8" fill="#3B82F6" opacity="0.8"/>
    <rect x="${width*0.15+20}" y="120" width="${width*0.7-40}" height="60" rx="8" fill="#F3F4F6"/>
    <rect x="${width*0.15+20}" y="195" width="${width*0.7-40}" height="60" rx="8" fill="#F3F4F6"/>
    <rect x="${width*0.15+20}" y="270" width="${width*0.7-40}" height="60" rx="8" fill="#F3F4F6"/>

    <!-- Mock bottom nav -->
    <rect x="${width*0.15+20}" y="${height-80}" width="${width*0.7-40}" height="40" rx="8" fill="#1F2937" opacity="0.8"/>
  ` : ''}

  <!-- Title -->
  <text x="${width/2}" y="${height/2 - 30}"
        font-family="Arial, sans-serif"
        font-size="${width > 1000 ? '48' : '32'}"
        font-weight="bold"
        fill="${textColor}"
        text-anchor="middle"
        opacity="0.9">
    ${title}
  </text>

  <!-- Subtitle -->
  <text x="${width/2}" y="${height/2 + 20}"
        font-family="Arial, sans-serif"
        font-size="${width > 1000 ? '24' : '18'}"
        fill="${textColor}"
        text-anchor="middle"
        opacity="0.7">
    ${subtitle}
  </text>

  <!-- Dimensions label -->
  <text x="${width/2}" y="${height - 30}"
        font-family="Arial, sans-serif"
        font-size="16"
        fill="${textColor}"
        text-anchor="middle"
        opacity="0.5">
    ${width} × ${height}px
  </text>
</svg>`;

  return svg;
}

// Generate the three placeholder images
const placeholders = [
  {
    name: 'quiz-interface',
    width: 1600,
    height: 1000,
    bgColor: '#6366F1',
    textColor: '#FFFFFF',
    title: 'Quiz Interface',
    subtitle: 'Real Exam Simulation'
  },
  {
    name: 'analytics-view',
    width: 800,
    height: 600,
    bgColor: '#3B82F6',
    textColor: '#FFFFFF',
    title: 'Analytics',
    subtitle: 'Performance Tracking'
  },
  {
    name: 'mobile-view',
    width: 600,
    height: 1200,
    bgColor: '#8B5CF6',
    textColor: '#FFFFFF',
    title: 'Mobile',
    subtitle: 'Study on the Go'
  }
];

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'public', 'images', 'placeholders');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Generating placeholder images...\n');

placeholders.forEach(config => {
  const svg = generatePlaceholder(
    config.name,
    config.width,
    config.height,
    config.bgColor,
    config.textColor,
    config.title,
    config.subtitle
  );

  const svgPath = path.join(outputDir, `${config.name}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ Generated ${config.name}.svg (${config.width}×${config.height}px)`);
});

console.log('\n✅ All placeholder SVG images generated successfully!');
console.log(`📁 Location: ${outputDir}`);
console.log('\n📝 Next steps:');
console.log('1. Convert SVG to PNG using an online tool or sharp library');
console.log('2. Or use the SVG files directly in your Next.js Image components');
console.log('3. Replace the current images in public/images/');
