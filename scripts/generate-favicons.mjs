#!/usr/bin/env node
/**
 * Generate favicon.ico and apple-touch-icon.png from public/logo.png.
 *
 * Usage: node scripts/generate-favicons.mjs [source]
 *   source  Path to source image (default: public/logo.png)
 *
 * Outputs:
 *   public/favicon.ico        — 32x32 ICO (legacy browsers)
 *   public/apple-touch-icon.png — 180x180 PNG (iOS home screen)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname;
const source = resolve(root, process.argv[2] ?? 'public/logo.png');

const input = await readFile(source);

// --- apple-touch-icon.png (180x180) ---
const applePng = await sharp(input).resize(180, 180, { fit: 'cover' }).png().toBuffer();

await writeFile(resolve(root, 'public/apple-touch-icon.png'), applePng);
console.log('✓ public/apple-touch-icon.png (180×180)');

// --- favicon.ico (32x32) ---
// ICO format: ICONDIR header + one ICONDIRENTRY + raw PNG data
const faviconPng = await sharp(input).resize(32, 32, { fit: 'cover' }).png().toBuffer();

const ico = buildIco([faviconPng]);
await writeFile(resolve(root, 'public/favicon.ico'), ico);
console.log('✓ public/favicon.ico (32×32)');

/**
 * Build a minimal ICO file from an array of PNG buffers.
 * @param {Buffer[]} pngs
 * @returns {Buffer}
 */
function buildIco(pngs) {
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + entrySize * pngs.length;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = ICO
  header.writeUInt16LE(pngs.length, 4); // image count

  const entries = [];
  let offset = dirSize;

  for (const png of pngs) {
    const entry = Buffer.alloc(entrySize);
    // width/height 0 means 256 in ICO spec; for <=255, use actual value
    entry.writeUInt8(32, 0); // width
    entry.writeUInt8(32, 1); // height
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...pngs]);
}
