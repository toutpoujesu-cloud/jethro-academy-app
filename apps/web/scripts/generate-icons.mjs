/**
 * Generates all PWA icon sizes from an SVG source using sharp.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = join(__dirname, '../public/icons');

// Jethro Academy icon — navy shield with gold "J"
const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="#0B1C3E"/>
  <!-- Shield shape -->
  <path d="M256 80 L400 140 L400 280 Q400 380 256 440 Q112 380 112 280 L112 140 Z"
        fill="#C9A84C" opacity="0.15"/>
  <!-- Gold J letterform -->
  <text x="256" y="330"
        font-family="Georgia, serif"
        font-size="260"
        font-weight="700"
        fill="#C9A84C"
        text-anchor="middle"
        letter-spacing="-8">J</text>
  <!-- Thin gold underline accent -->
  <rect x="160" y="370" width="192" height="6" rx="3" fill="#C9A84C" opacity="0.6"/>
</svg>
`.trim();

const svgBuffer = Buffer.from(SVG);

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const filename = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
    const outPath  = join(OUT_DIR, filename);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);

    console.log(`  ✅ ${filename} (${size}x${size})`);
  }

  // Also write favicon.ico (32x32)
  const faviconPath = join(OUT_DIR, '../favicon.ico');
  await sharp(svgBuffer).resize(32, 32).png().toFile(faviconPath);
  console.log('  ✅ favicon.ico (32x32)');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
