import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('.', import.meta.url));

/** @param {string[]} filePaths @returns {string | undefined} */
function getLatestCommitDate(filePaths) {
  if (filePaths.length === 0) return undefined;
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...filePaths], {
      encoding: 'utf-8',
      cwd,
    }).trim();
    return date || undefined;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[sitemap] Could not read git log for ${filePaths.join(', ')}:`, e instanceof Error ? e.message : e);
    return undefined;
  }
}

// Shared files that affect all pages (layout, nav, footer, contact, styles)

const sharedFiles = [
  'src/layouts/Base.astro',
  'src/components/Nav.astro',
  'src/components/Footer.astro',
  'src/components/Contact.astro',
  'src/data/nav-links.ts',
  'src/data/contacts.ts',
  'src/styles/global.css',
];

// When adding a new page to src/pages/, add its route and source files here
// so the sitemap gets a git-based lastmod for it.
const pageInputs = {
  '/': [
    'src/pages/index.astro',
    'src/data/social-links.ts',
    'src/data/theme.ts',
    'src/data/organization.ts',
    ...sharedFiles,
  ],
  '/artists/': ['src/pages/artists.astro', 'src/content.config.ts', 'src/content/artists', ...sharedFiles],
  '/events/': ['src/pages/events.astro', 'src/utils/date.ts', 'src/data/organization.ts', ...sharedFiles],
};

const lastmodMap = Object.fromEntries(
  Object.entries(pageInputs).map(([route, files]) => [route, getLatestCommitDate(files)]),
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
