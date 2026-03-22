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
  return dates.reduce((a, b) => (a > b ? a : b));
}

// When adding a new page to src/pages/, add its route and source files here
// so the sitemap gets a git-based lastmod for it.
const pageInputs = {
  '/': ['src/pages/index.astro', 'src/data/social-links.ts'],
  '/artists/': ['src/pages/artists.astro', 'src/content/artists'],
  '/events/': ['src/pages/events.astro'],
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
