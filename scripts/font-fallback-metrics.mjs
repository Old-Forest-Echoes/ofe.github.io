#!/usr/bin/env node
/**
 * Calculate fallback @font-face metric overrides for all combinations
 * of local system fallback fonts with the project's web fonts.
 *
 * Usage:
 *   node scripts/font-fallback-metrics.mjs
 *
 * Requires (installed temporarily):
 *   npm install --no-save opentype.js wawoff2
 *
 * How it works:
 *   1. Decompresses each WOFF2 web font to read its OpenType tables
 *   2. Loads each system fallback font from well-known OS paths
 *   3. Measures actual glyph advance widths on representative text to
 *      compute an accurate size-adjust (better than xAvgCharWidth)
 *   4. Derives ascent-override, descent-override, and line-gap-override
 *      from the web font's OS/2 metrics, scaled by size-adjust
 *   5. Outputs ready-to-paste CSS @font-face blocks
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Configuration — edit these to match your project
// ---------------------------------------------------------------------------

/** Web fonts to generate fallbacks for. */
const webFonts = [
  { name: 'Leonetta Serif', file: 'public/fonts/Leonetta-Serif.woff2', weight: 400 },
  { name: 'Spectral', file: 'public/fonts/Spectral-Light.woff2', weight: 300 },
  { name: 'Spectral', file: 'public/fonts/Spectral-Regular.woff2', weight: 400 },
];

/**
 * System fallback fonts to measure against.
 * Paths are tried in order — the first that exists on this machine is used.
 * Add paths for Linux / Windows as needed.
 */
const fallbackFonts = [
  {
    name: 'Georgia',
    paths: [
      // macOS
      '/System/Library/Fonts/Supplemental/Georgia.ttf',
      // Windows
      'C:\\Windows\\Fonts\\georgia.ttf',
      // Linux (common locations)
      '/usr/share/fonts/truetype/msttcorefonts/Georgia.ttf',
      '/usr/share/fonts/TTF/georgia.ttf',
    ],
  },
  {
    name: 'Palatino Linotype',
    paths: [
      // macOS — Palatino is bundled as a TTC; Palatino Linotype is the Windows name
      '/System/Library/Fonts/Palatino.ttc',
      '/System/Library/Fonts/Supplemental/Palatino.ttc',
      // Windows
      'C:\\Windows\\Fonts\\pala.ttf',
    ],
  },
  {
    name: 'Palatino',
    paths: [
      '/System/Library/Fonts/Palatino.ttc',
      '/System/Library/Fonts/Supplemental/Palatino.ttc',
      '/usr/share/fonts/truetype/Palatino.ttf',
    ],
  },
  {
    name: 'Times New Roman',
    paths: [
      '/System/Library/Fonts/Supplemental/Times New Roman.ttf',
      'C:\\Windows\\Fonts\\times.ttf',
      '/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman.ttf',
    ],
  },
];

/** Representative English text for glyph width measurement. */
const TEST_TEXT =
  'Old Forest Echoes is a music and nature conservation project ' +
  'featuring concerts and events across Finland and Europe. ' +
  'The quick brown fox jumps over the lazy dog. 0123456789';

// ---------------------------------------------------------------------------
// Font loading helpers
// ---------------------------------------------------------------------------

/** @type {typeof import('opentype.js')} */
let opentype;
/** @type {typeof import('wawoff2')} */
let wawoff2;

async function loadDeps() {
  try {
    opentype = await import('opentype.js');
    wawoff2 = await import('wawoff2');
  } catch {
    console.error(
      'Missing dependencies. Install them temporarily with:\n\n' + '  npm install --no-save opentype.js wawoff2\n',
    );
    process.exit(1);
  }
}

/** Load a WOFF2 web font, decompress, and parse. */
async function loadWoff2(filePath) {
  const woff2Buf = readFileSync(resolve(filePath));
  const sfnt = await wawoff2.decompress(woff2Buf);
  const buf = Buffer.from(sfnt);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/**
 * Extract a standalone SFNT buffer from a TTC (TrueType Collection).
 * TTC sub-fonts share table data at arbitrary offsets within the file,
 * so we must rebuild a self-contained SFNT by copying each table and
 * rewriting the offset table directory to point to the new positions.
 */
function extractFromTtc(buf, faceIndex = 0) {
  const numFonts = buf.readUInt32BE(8);
  if (faceIndex >= numFonts) throw new Error(`TTC has ${numFonts} faces, requested index ${faceIndex}`);
  const fontOffset = buf.readUInt32BE(12 + faceIndex * 4);
  const numTables = buf.readUInt16BE(fontOffset + 4);
  const dirSize = 12 + numTables * 16;

  // Collect table locations from the original file
  const tables = [];
  let totalSize = dirSize;
  for (let i = 0; i < numTables; i++) {
    const rec = fontOffset + 12 + i * 16;
    const offset = buf.readUInt32BE(rec + 8);
    const length = buf.readUInt32BE(rec + 12);
    tables.push({ dirPos: 12 + i * 16, offset, length });
    totalSize += Math.ceil(length / 4) * 4; // 4-byte aligned
  }

  // Build a new self-contained SFNT buffer
  const sfnt = Buffer.alloc(totalSize);
  buf.copy(sfnt, 0, fontOffset, fontOffset + dirSize); // header + directory

  let writePos = dirSize;
  for (const t of tables) {
    sfnt.writeUInt32BE(writePos, t.dirPos + 8); // patch offset
    buf.copy(sfnt, writePos, t.offset, t.offset + t.length);
    writePos += Math.ceil(t.length / 4) * 4;
  }

  return sfnt;
}

/**
 * Load a local system font (TTF/OTF/TTC). Returns null if not found.
 * For TTC files, extracts the first face into a standalone SFNT.
 */
function loadSystemFont(paths) {
  for (const p of paths) {
    try {
      const buf = readFileSync(p);
      const sig = buf.toString('ascii', 0, 4);
      if (sig === 'ttcf') {
        const sfnt = extractFromTtc(buf);
        const ab = sfnt.buffer.slice(sfnt.byteOffset, sfnt.byteOffset + sfnt.byteLength);
        return opentype.parse(ab);
      }
      return opentype.loadSync(p);
    } catch {
      continue;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Metric calculation
// ---------------------------------------------------------------------------

/** Measure total advance width of a string, normalized to em units. */
function measureText(font, text) {
  let totalWidth = 0;
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    totalWidth += glyph.advanceWidth || 0;
  }
  return totalWidth / font.tables.head.unitsPerEm;
}

/**
 * Calculate the four CSS @font-face override values that make a local
 * fallback font match the metrics of a web font.
 *
 * - size-adjust: scales the fallback so its character widths match the web font
 * - ascent/descent/line-gap-override: match the web font's vertical metrics
 *   (divided by size-adjust so the effective values are correct after scaling)
 */
function calcOverrides(webFont, fallbackFont) {
  const webWidth = measureText(webFont, TEST_TEXT);
  const fallbackWidth = measureText(fallbackFont, TEST_TEXT);

  const sizeAdjust = webWidth / fallbackWidth;

  const upm = webFont.tables.head.unitsPerEm;
  const ascent = webFont.tables.os2.sTypoAscender;
  const descent = Math.abs(webFont.tables.os2.sTypoDescender);
  const lineGap = webFont.tables.os2.sTypoLineGap;

  return {
    sizeAdjust: round(sizeAdjust * 100),
    ascentOverride: round((ascent / upm / sizeAdjust) * 100),
    descentOverride: round((descent / upm / sizeAdjust) * 100),
    lineGapOverride: round((lineGap / upm / sizeAdjust) * 100),
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// CSS output
// ---------------------------------------------------------------------------

function toCss(webFontName, weight, fallbackName, overrides) {
  return [
    `@font-face {`,
    `  font-family: '${webFontName} Fallback';`,
    `  src: local('${fallbackName}');`,
    `  font-weight: ${weight};`,
    `  size-adjust: ${overrides.sizeAdjust}%;`,
    `  ascent-override: ${overrides.ascentOverride}%;`,
    `  descent-override: ${overrides.descentOverride}%;`,
    `  line-gap-override: ${overrides.lineGapOverride}%;`,
    `}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await loadDeps();

  // Load all system fallback fonts
  const loadedFallbacks = [];
  for (const fb of fallbackFonts) {
    const font = loadSystemFont(fb.paths);
    if (font) {
      loadedFallbacks.push({ name: fb.name, font });
      console.error(`  Found ${fb.name}`);
    } else {
      console.error(`  Skipped ${fb.name} (not found on this system)`);
    }
  }

  if (loadedFallbacks.length === 0) {
    console.error('\nNo fallback fonts found on this system.');
    process.exit(1);
  }

  console.error('');

  // Process each web font × fallback combination
  const blocks = [];

  for (const wf of webFonts) {
    const webFont = await loadWoff2(wf.file);
    console.error(`${wf.name} (weight ${wf.weight}) — ${wf.file}`);

    for (const fb of loadedFallbacks) {
      const overrides = calcOverrides(webFont, fb.font);
      console.error(
        `  → ${fb.name}: size-adjust ${overrides.sizeAdjust}%, ` +
          `ascent ${overrides.ascentOverride}%, descent ${overrides.descentOverride}%, ` +
          `line-gap ${overrides.lineGapOverride}%`,
      );
      blocks.push(toCss(wf.name, wf.weight, fb.name, overrides));
    }

    console.error('');
  }

  // Output CSS to stdout
  console.log('/* Fallback @font-face declarations — adjust system fonts to match web font metrics,');
  console.log('   reducing CLS during font swap. Values derived from glyph width measurement.');
  console.log(`   Generated by: node scripts/font-fallback-metrics.mjs */\n`);
  console.log(blocks.join('\n\n'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
