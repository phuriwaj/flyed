// Generates public/og-default.png (1200x630) using the favicon mark + "flyed" wordmark.
// Run: node scripts/generate-og-image.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

const W = 1200;
const H = 630;
const BG = { r: 29, g: 29, b: 31 }; // #1d1d1f
const FG = { r: 255, g: 255, b: 255 };

async function main() {
  // The favicon is a 128x128 viewBox SVG. Inflate to a generous size for the OG card.
  const faviconSvg = await readFile(resolve(publicDir, 'favicon.svg'), 'utf8');
  // Strip the dark-mode media query and force a white fill so it pops on the dark BG.
  const whiteFavicon = faviconSvg.replace(
    /<style>[\s\S]*?<\/style>/,
    '<style>path { fill: #FFFFFF; }</style>',
  );
  const mark = await sharp(Buffer.from(whiteFavicon))
    .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Wordmark text: "flyed". Render via SVG so we get crisp typography without font deps.
  const wordmarkSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="200" viewBox="0 0 ${W} 200">
      <text x="50%" y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        font-size="160"
        font-weight="700"
        letter-spacing="-6"
        fill="#FFFFFF">flyed</text>
    </svg>`,
  );
  const wordmark = await sharp(wordmarkSvg)
    .resize({ width: 600, withoutEnlargement: true })
    .png()
    .toBuffer();

  const markMeta = await sharp(mark).metadata();
  const wordMeta = await sharp(wordmark).metadata();
  const markX = Math.round((W - markMeta.width) / 2);
  const markY = Math.round((H - markMeta.height - wordMeta.height - 40) / 2);
  const wordX = Math.round((W - wordMeta.width) / 2);
  const wordY = markY + markMeta.height + 40;

  const out = await sharp({
    create: { width: W, height: H, channels: 3, background: BG },
  })
    .composite([
      { input: mark, left: markX, top: markY },
      { input: wordmark, left: wordX, top: wordY },
    ])
    .png({ compressionLevel: 9 })
    .toFile(resolve(publicDir, 'og-default.png'));

  console.log(`Wrote public/og-default.png: ${out.width}x${out.height}, ${out.size} bytes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
