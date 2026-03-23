# Old Forest Echoes — Astro Site

Website for Old Forest Echoes (Ikimetsän kaiku), a music and nature conservation project. Astro 6 static site deployed on GitHub Pages at oldforestechoes.com.

## Commands

```bash
nvm use             # Required — reads .nvmrc to select Node version
npm run dev         # Dev server at localhost:4321
npm run build       # Production build to dist/
npm run preview     # Preview production build
npm run lint        # ESLint + Stylelint + Prettier check
npm run format      # Auto-format with Prettier
npm run check       # Astro type checking
npm run validate    # Lint + type check (lint && check)
```

## Architecture

- **Astro 6** static site, zero JS framework runtime
- **Single CSS file** (`src/styles/global.css`) — all styling, CSS custom properties
- **Self-hosted fonts** — Leonetta Serif (WOFF2) + Spectral (WOFF2, 2 weights), no Google Fonts
- **Content Collections** for artists (Markdown with Zod schema)
- **Typed inline data** for events (in `src/pages/events.astro`)
- **Astro Image pipeline** for all images (responsive WebP srcsets)
- **YouTube lite facade** — thumbnail + play button, iframe only on click

## Project Structure

```
├── astro.config.mjs              # Site config, sitemap with git-based lastmod
├── eslint.config.mjs             # ESLint flat config (TS + Astro + Prettier)
├── .stylelintrc.json             # Stylelint config (standard + HTML/Astro)
├── .prettierrc                   # Prettier config with Astro plugin
├── tsconfig.json                 # Extends astro/tsconfigs/strict
├── src/
│   ├── layouts/Base.astro        # HTML shell, SEO meta, OG tags, responsive bg
│   ├── components/
│   │   ├── Nav.astro             # Sticky nav, mobile menu with <button> toggle
│   │   ├── Footer.astro          # Social links (target="_blank", rel="noopener" for own profiles)
│   │   ├── Contact.astro         # Shared contact section (used on all content pages)
│   │   ├── YouTubeEmbed.astro    # Lite facade — no iframe until click
│   │   └── JsonLd.astro          # Generic JSON-LD structured data wrapper
│   ├── pages/
│   │   ├── index.astro           # About page + WebSite/Organization schemas
│   │   ├── artists.astro         # Content collection query + Person schemas
│   │   ├── events.astro          # Event calendar + MusicEvent schemas (inline data)
│   │   └── 404.astro             # Custom 404 (noindex)
│   ├── content/
│   │   └── artists/*.md          # Artist bios with frontmatter
│   ├── content.config.ts         # Zod schema: name, role, order, image
│   ├── data/nav-links.ts         # Navigation links (shared by Nav + Base breadcrumbs)
│   ├── data/social-links.ts      # Social media links (shared by Footer + index)
│   ├── data/contacts.ts          # Contact info (shared by Contact + index schema)
│   ├── data/organization.ts      # Organization schema data (shared by index + events)
│   ├── data/theme.ts             # Theme constants (shared by Base meta + CSS)
│   ├── utils/date.ts             # Date helpers (shared by events build + client)
│   ├── assets/images/            # Source images (processed by Astro)
│   └── styles/global.css         # Single stylesheet
├── public/
│   ├── fonts/                    # Leonetta-Serif.woff2, Spectral-{Light,Regular}.woff2
│   ├── icons/                    # facebook.svg, instagram.svg, youtube.svg, linktree.svg
│   ├── images/og-image-landscape.webp  # OG image for social sharing (1200x630)
│   ├── logo.svg                  # SVG logo (also used as favicon)
│   ├── apple-touch-icon.png      # 180x180 iOS icon
│   ├── favicon.ico                # Legacy ICO fallback (auto-requested by old browsers)
│   ├── robots.txt
│   └── CNAME                     # GitHub Pages custom domain
└── dist/                         # Build output (gitignored)
```

## Content Editing

### Artists

Edit `src/content/artists/<name>.md`. Frontmatter schema:

```yaml
---
name: Artist Name
role: music | featured | land-art | soundscapes
order: 1 # Sort order within page
image: ../../assets/images/filename.jpg # Relative path to image in src/assets/images/
---
```

Body is Markdown prose. Images are auto-optimized to WebP with responsive srcsets.

### Events

Edit the `events` array in `src/pages/events.astro`. Each entry is typed as `EventEntry`:

```ts
{ date: "2026-03-06", location: "Sipoo", locationLanguage: "fi", country: "Finland" }
{ date: "2026-05-23", endDate: "2026-05-24", description: "Garden Festival", location: "Koroinen", locationLanguage: "fi", country: "Finland" }
{ date: "2026-06-25", description: "Akcent & Barbora Xu", venue: "Lidové Sady", venueLanguage: "cs", location: "Liberec", locationLanguage: "cs", country: "Czechia" }
{ date: "2026-08-08", endDate: "2026-08-09", description: "Norpas Festival", country: "Finland" }
```

- `description` (optional): English event/concert name — rendered without a `lang` attribute
- `venue` (optional): Venue/building name — used as `Place.name` in JSON-LD structured data
- `venueLanguage` (optional): BCP 47 language tag for the `venue` field (e.g. `"fi"`, `"cs"`, `"de"`)
- `location` (optional): City/locality name — used as `addressLocality` in JSON-LD, wrapped in `<span lang>` using `locationLanguage`
- `locationLanguage` (optional): BCP 47 language tag for the `location` field (e.g. `"fi"`, `"cs"`, `"de"`)
- `country` (required): Country name — must exist in the `countryCodes` map (validated at build time)
- `schemaType` (optional): `'MusicEvent'` (default) or `'Event'` — controls the JSON-LD `@type` and whether a `performer` field is included
- At least one of `description`, `venue`, or `location` is required per event

Dates must be ISO `YYYY-MM-DD` format (validated at build time). Past events are automatically dimmed (build-time + client-side check). Past events are excluded from JSON-LD structured data. A daily GitHub Actions cron rebuild keeps this current.

### Adding a new artist

1. Add image to `src/assets/images/<name>.jpg`
2. Create `src/content/artists/<name>.md` with frontmatter
3. The artists page auto-renders based on role grouping

## Conventions

- **CSS**: All colors use custom properties from `:root`. No hardcoded colors.
- **Fonts**: `--font-display` (Leonetta Serif) for headings/nav, `--font-body` (Spectral) for body text.
- **Images in `src/assets/`**: Processed by Astro (responsive WebP). Use for content images.
- **Images in `public/`**: Served as-is. Use for icons, logos, OG images.
- **External links**: Use `target="_blank" rel="noopener"`. The project's own social profiles (Facebook, Instagram, YouTube, Linktree) use `rel="noopener"` without `noreferrer` to allow referrer analytics on those accounts. Add `noreferrer` for unrelated third-party links where the referrer should be hidden.
- **Non-English text**: Wrap in `<span lang="xx">` for screen reader pronunciation (e.g. `fi`, `cs`, `de`, `sv`, `it`, `zh`). Events use per-entry `locationLanguage`/`venueLanguage`.
- **No inline style attributes** (`style="..."`). Scoped `<style>` blocks in Astro components are acceptable.
- **Semantic HTML**: `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<time>`.
- **Accessibility**: Skip link, ARIA attributes on nav toggle, focus trapping in mobile menu.

## SEO Checklist

Each page gets via Base.astro: meta description, canonical URL, OG tags, Twitter cards, robots directive, theme-color, favicon, sitemap link. Pass `title` and `description` props to `<Base>`. Add `noindex` prop for pages that shouldn't be indexed.

JSON-LD structured data is added per-page:

- **Base.astro**: BreadcrumbList schema on non-index content pages (artists, events)
- **index.astro**: WebSite + Organization schemas (via `@graph`)
- **artists.astro**: Person schema per artist (jobTitle varies by role)
- **events.astro**: MusicEvent schema per event

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages automatically on push to `master` and daily at 04:00 UTC (to keep past-event styling and structured data current). Manual deploys via `workflow_dispatch`. The CNAME file maps to oldforestechoes.com.
