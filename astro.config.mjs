import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('.', import.meta.url));

/** @param {string} filePath @returns {string | undefined} */
function getLastCommitDate(filePath) {
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cI', '--', filePath], {
      encoding: 'utf-8',
      cwd,
    }).trim();
    return date || undefined;
  } catch (e) {
    console.warn(`[sitemap] Could not read git log for ${filePath}:`, e instanceof Error ? e.message : e);
    return undefined;
  }
}

/** @param {string[]} filePaths @returns {string | undefined} */
function getLatestCommitDate(filePaths) {
  const dates = filePaths.map(getLastCommitDate).filter(Boolean);
  if (dates.length === 0) return undefined;
  return dates.reduce((a, b) => (a > b ? a : b), dates[0]);
}

// When adding a new page to src/pages/, add its route and source files here
// so the sitemap gets a git-based lastmod for it.
// Shared files that affect all pages (layout, nav, footer, contact, styles)
const sharedFiles = [
  'src/layouts/Base.astro',
  'src/components/Nav.astro',
  'src/components/Footer.astro',
  'src/components/Contact.astro',
  'src/styles/global.css',
];

const pageInputs = {
  '/': ['src/pages/index.astro', 'src/data/social-links.ts', ...sharedFiles],
  '/artists/': ['src/pages/artists.astro', 'src/content/artists', ...sharedFiles],
  '/events/': ['src/pages/events.astro', ...sharedFiles],
};

const lastmodMap = Object.fromEntries(
  Object.entries(pageInputs).map(([route, files]) => [route, getLatestCommitDate(files)])
);

export default defineConfig({
  site: 'https://oldforestechoes.com',
  output: 'static',
  compressHTML: true,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        const path = new URL(item.url).pathname;
        const lastmod = lastmodMap[path];
        if (lastmod) {
          item.lastmod = lastmod;
        }
        return item;
      },
    }),
  ],
});
