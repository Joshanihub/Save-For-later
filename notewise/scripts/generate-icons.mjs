/**
 * Generate PNG icons for the Chrome extension from the Notewise logo.
 * Uses the `sharp` library for high-quality PNG resizing.
 *
 * Usage: node scripts/generate-icons.mjs
 */
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SIZES = [16, 32, 48, 128];
const SOURCE_PATH = resolve(__dirname, '..', 'src', 'assets', 'Notewise.png');
const ICONS_DIR = resolve(__dirname, '..', 'public', 'icons');

async function main() {
  const sharp = (await import('sharp')).default;

  if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
  }

  const sourceBuffer = readFileSync(SOURCE_PATH);

  for (const size of SIZES) {
    const outputPath = resolve(ICONS_DIR, `icon${size}.png`);
    await sharp(sourceBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated ${outputPath} (${size}x${size})`);
  }

  console.log('\nAll icons generated successfully!');
}

main().catch((err) => {
  console.error('Error generating icons:', err.message);
  process.exit(1);
});
