# Old Forest Echoes — Astro Site

Website for Old Forest Echoes (Ikimetsän kaiku), a music and nature conservation project. Astro 6 static site deployed on GitHub Pages at oldforestechoes.com.

## Commands

```bash
cd v2
nvm use node        # Required — node is managed via nvm
npm run dev         # Dev server at localhost:4321
npm run build       # Production build to dist/
npm run preview     # Preview production build
```

## Architecture

- **Astro 6** static site, zero JS framework runtime
- **Single CSS file** (`src/styles/global.css`) — all styling, ~5KB, CSS custom properties
- **Self-hosted fonts** — Leonetta Serif (WOFF2) + Montserrat (WOFF2 variable), no Google Fonts
- **Content Collections** for artists (Markdown with Zod schema)
- **JSON data** for events (`src/data/events-2026.json`)
- **Astro Image pipeline** for all images (responsive WebP srcsets)
- **YouTube lite facade** — thumbnail + play button, iframe only on click

## Project Structure

```
v2/
├── astro.config.mjs              # Site config, sitemap with git-based lastmod
├── src/
│   ├── layouts/Base.astro        # HTML shell, SEO meta, OG tags, responsive bg
│   ├── components/
│   │   ├── Nav.astro             # Sticky nav, mobile menu with <button> toggle
│   │   ├── Footer.astro          # Social links (target="_blank", rel="noopener")
│   │   ├── Contact.astro         # Shared contact section (used on index + artists)
│   │   ├── YouTubeEmbed.astro    # Lite facade — no iframe until click
│   │   └── JsonLd.astro          # Generic JSON-LD structured data wrapper
│   ├── pages/
│   │   ├── index.astro           # About page + Organization schema
│   │   ├── artists.astro         # Content collection query + Person schemas
│   │   ├── events.astro          # Event calendar + MusicEvent schemas
│   │   └── 404.astro             # Custom 404 (noindex)
│   ├── content/
│   │   ├── config.ts             # Zod schema: name, role, order, image
│   │   └── artists/*.md          # 6 artist bios with frontmatter
│   ├── data/events-2026.json     # Event calendar entries
│   ├── assets/images/            # Source images (processed by Astro)
│   └── styles/global.css         # Single stylesheet
├── public/
│   ├── fonts/                    # Leonetta-Serif.woff2, Montserrat.woff2
│   ├── icons/                    # facebook.svg, instagram.svg, youtube.svg, linktree.svg
│   ├── images/og-image.webp      # OG image for social sharing
│   ├── logo.svg                  # SVG logo (also used as favicon)
│   ├── apple-touch-icon.png      # 180x180 iOS icon
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
order: 1          # Sort order within page
image: filename.jpg  # Must exist in src/assets/images/
---
```
Body is Markdown prose. Images are auto-optimized to WebP with responsive srcsets.

### Events
Edit `src/data/events-2026.json`. Each entry:
```json
{ "date": "2026-03-06", "venue": "Sipoo", "country": "Finland" }
{ "date": "2026-05-23", "endDate": "2026-05-24", "venue": "Festival Name", "country": "Finland" }
```
Past events are automatically dimmed (build-time + client-side check).

### Adding a new artist
1. Add image to `src/assets/images/<name>.jpg`
2. Create `src/content/artists/<name>.md` with frontmatter
3. The artists page auto-renders based on role grouping

## Conventions

- **CSS**: All colors use custom properties from `:root`. No hardcoded colors.
- **Fonts**: `--font-display` (Leonetta Serif) for headings/nav, `--font-body` (Montserrat) for body text.
- **Images in `src/assets/`**: Processed by Astro (responsive WebP). Use for content images.
- **Images in `public/`**: Served as-is. Use for icons, logos, OG images.
- **External links**: Always use `target="_blank" rel="noopener noreferrer"`.
- **Finnish text**: Wrap in `<span lang="fi">` for screen reader pronunciation.
- **No inline styles** except on the 404 page.
- **Semantic HTML**: `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<time>`.
- **Accessibility**: Skip link, ARIA attributes on nav toggle, focus trapping in mobile menu.

## SEO Checklist

Each page gets via Base.astro: meta description, canonical URL, OG tags, Twitter cards, robots directive, theme-color, favicon, sitemap link. Pass `title` and `description` props to `<Base>`. Add `noindex` prop for pages that shouldn't be indexed.

JSON-LD structured data is added per-page:
- **index.astro**: Organization schema
- **artists.astro**: Person schema per artist (jobTitle varies by role)
- **events.astro**: MusicEvent schema per event

## Deployment

GitHub Pages from the `v2/dist/` directory. The CNAME file maps to oldforestechoes.com. Build with `npm run build` in the `v2/` directory.
