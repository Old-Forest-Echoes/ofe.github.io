#!/usr/bin/env node
/**
 * Calculate fallback @font-face metric overrides for all combinations
 * of local system fallback fonts with the project's web fonts.
 *
 * Usage:
 *   node scripts/font-fallback-metrics.mjs
 *
 * Requires (installed temporarily):
 *   npm install --no-save fontkit
 *
 * How it works:
 *   1. Loads each web font (WOFF2) and system font (TTF/OTF/TTC) via fontkit
 *   2. Measures actual glyph advance widths on representative text using
 *      fontkit's layout engine to compute an accurate size-adjust
 *   3. Derives ascent-override, descent-override, and line-gap-override
 *      from the web font's vertical metrics, scaled by size-adjust
 *   4. Outputs ready-to-paste CSS @font-face blocks
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
 *
 * Each entry has a CSS name (used in the fallback font-family), one or more
 * local() names (for the src descriptor — allows a single @font-face to
 * target the same typeface under different OS names), and candidate file
 * paths tried in order until one loads.
 *
 * Example: Palatino is called "Palatino" on macOS and "Palatino Linotype"
 * on Windows. They are the same typeface, so a single @font-face with
 * src: local('Palatino Linotype'), local('Palatino') covers both platforms.
 */
const fallbackFonts = [
  {
    cssName: 'Georgia',
    localNames: ['Georgia'],
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
    cssName: 'Palatino',
    // Palatino (macOS) and Palatino Linotype (Windows) are the same typeface
    localNames: ['Palatino Linotype', 'Palatino'],
    paths: [
      '/System/Library/Fonts/Palatino.ttc',
      '/System/Library/Fonts/Supplemental/Palatino.ttc',
      'C:\\Windows\\Fonts\\pala.ttf',
      '/usr/share/fonts/truetype/Palatino.ttf',
    ],
  },
  {
    cssName: 'Times New Roman',
    localNames: ['Times New Roman'],
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
// Font loading
// ---------------------------------------------------------------------------

let fontkit;

async function loadDeps() {
  try {
    const mod = await import('fontkit');
    fontkit = mod.default ?? mod;
  } catch {
    console.error('Missing dependency. Install it temporarily with:\n\n' + '  npm install --no-save fontkit\n');
    process.exit(1);
  }
}

/**
 * Load a font file via fontkit. Handles WOFF2, TTF, OTF, and TTC natively.
 * For TTC files, returns the first face.
 * @param {string} filePath - Path to the font file
 * @returns {import('fontkit').Font} The loaded font (or first face for TTC)
 */
function loadFont(filePath) {
  const buf = readFileSync(resolve(filePath));
  const font = fontkit.create(buf);
  // TTC collections have a .fonts array — use the first face
  return font.fonts ? font.fonts[0] : font;
}

/**
 * Load a system fallback font from well-known paths.
 * Returns null if not found on this machine.
 * @param {string[]} paths - Candidate file paths to try in order
 * @returns {import('fontkit').Font | null}
 */
function loadSystemFont(paths) {
  for (const p of paths) {
    try {
      return loadFont(p);
    } catch (e) {
      console.error(`    Could not load ${p}: ${e instanceof Error ? e.message : e}`);
      continue;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Metric calculation
// ---------------------------------------------------------------------------

/**
 * Measure total advance width of a string, normalized to em units.
 * @param {import('fontkit').Font} font
 * @param {string} text
 * @returns {number}
 */
function measureText(font, text) {
  return font.layout(text).advanceWidth / font.unitsPerEm;
}

/**
 * Calculate the four CSS @font-face override values that make a local
 * fallback font match the metrics of a web font.
 *
 * - size-adjust: scales the fallback so its character widths match the web font
 * - ascent/descent/line-gap-override: match the web font's vertical metrics
 *   (divided by size-adjust so the effective values are correct after scaling)
 */
/**
 * @param {import('fontkit').Font} webFont
 * @param {import('fontkit').Font} fallbackFont
 * @returns {{ sizeAdjust: number, ascentOverride: number, descentOverride: number, lineGapOverride: number }}
 */
function calcOverrides(webFont, fallbackFont) {
  const sizeAdjust = measureText(webFont, TEST_TEXT) / measureText(fallbackFont, TEST_TEXT);

  const upm = webFont.unitsPerEm;
  const ascent = webFont.ascent;
  const descent = Math.abs(webFont.descent);
  const lineGap = webFont.lineGap;

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

function fallbackFamilyName(webFontName, fallbackCssName) {
  return `${webFontName} ${fallbackCssName} Fallback`;
}

function toCss(webFontName, weight, fb, overrides) {
  const srcParts = fb.localNames.map((n) => `local('${n}')`).join(', ');
  return [
    `@font-face {`,
    `  font-family: '${fallbackFamilyName(webFontName, fb.cssName)}';`,
    `  src: ${srcParts};`,
    `  font-weight: ${weight};`,
    `  font-style: normal;`,
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
      loadedFallbacks.push({ ...fb, font });
      console.error(`  Found ${fb.cssName} (${fb.localNames.join(', ')})`);
    } else {
      console.error(`  Skipped ${fb.cssName} (not found on this system)`);
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
    const webFont = loadFont(wf.file);
    console.error(`${wf.name} (weight ${wf.weight}) — ${wf.file}`);

    for (const fb of loadedFallbacks) {
      const overrides = calcOverrides(webFont, fb.font);
      console.error(
        `  → ${fb.cssName}: size-adjust ${overrides.sizeAdjust}%, ` +
          `ascent ${overrides.ascentOverride}%, descent ${overrides.descentOverride}%, ` +
          `line-gap ${overrides.lineGapOverride}%`,
      );
      blocks.push(toCss(wf.name, wf.weight, fb, overrides));
    }

    console.error('');
  }

  // Build font-family stacks per unique web font name
  const stackMap = new Map();
  for (const wf of webFonts) {
    if (!stackMap.has(wf.name)) {
      const fallbackNames = loadedFallbacks.map((fb) => `'${fallbackFamilyName(wf.name, fb.cssName)}'`);
      stackMap.set(wf.name, `'${wf.name}', ${fallbackNames.join(', ')}, serif`);
    }
  }

  // Output CSS to stdout
  console.log('/* Fallback @font-face declarations — adjust system fonts to match web font metrics,');
  console.log('   reducing CLS during font swap. Values derived from glyph width measurement.');
  console.log(`   Generated by: node scripts/font-fallback-metrics.mjs */\n`);
  console.log(blocks.join('\n\n'));
  console.log('\n');
  console.log('/* font-family stacks:');
  for (const [name, stack] of stackMap) {
    console.log(`   ${name}: ${stack}`);
  }
  console.log('*/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
