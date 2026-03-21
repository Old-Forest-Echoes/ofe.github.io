import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execSync } from 'node:child_process';

function getLastCommitDate(filePath) {
  try {
    const date = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: 'utf-8',
      cwd: new URL('.', import.meta.url).pathname,
    }).trim();
    return date || undefined;
  } catch {
    return undefined;
  }
}

const pageFiles = {
  '/': 'src/pages/index.astro',
  '/artists/': 'src/pages/artists.astro',
  '/events/': 'src/pages/events.astro',
};

const lastmodMap = Object.fromEntries(
  Object.entries(pageFiles).map(([route, file]) => [route, getLastCommitDate(file)])
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
