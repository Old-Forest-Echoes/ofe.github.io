import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('.', import.meta.url));

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

function getLatestCommitDate(filePaths) {
  const dates = filePaths.map(getLastCommitDate).filter(Boolean);
  if (dates.length === 0) return undefined;
  return dates.reduce((a, b) => (a > b ? a : b));
}

const pageInputs = {
  '/': ['src/pages/index.astro'],
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
  integrations: [
    sitemap({
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
