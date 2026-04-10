const fs = require("fs");
const path = require("path");

// Simple SVG icon for BlueSpace
const createSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial,sans-serif" font-weight="bold" font-size="${size * 0.45}">B</text>
</svg>`;

const iconsDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

[192, 512].forEach((size) => {
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), createSVG(size));
  console.log(`Created icon-${size}.svg`);
});

// Also create a simple favicon
const favicon = createSVG(32);
fs.writeFileSync(path.join(__dirname, "..", "public", "favicon.svg"), favicon);
console.log("Created favicon.svg");
