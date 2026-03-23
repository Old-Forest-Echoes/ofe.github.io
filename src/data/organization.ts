import { primaryEmail } from './contacts';
import { socialLinks } from './social-links';

/**
 * Full Organization schema for JSON-LD structured data.
 * Used on index (as part of the @graph) and events (for performer/organizer references).
 * Accepts the resolved site URL so it can build absolute @id and logo URLs.
 */
export function organizationSchema(siteUrl: URL) {
  return {
    '@type': 'Organization' as const,
    '@id': new URL('#organization', siteUrl).href,
    name: 'Old Forest Echoes',
    alternateName: 'Ikimetsän kaiku',
    url: siteUrl.href,
    foundingDate: '2025',
    logo: {
      '@type': 'ImageObject' as const,
      url: new URL('/apple-touch-icon.png', siteUrl).href,
      width: 180,
      height: 180,
    },
    description:
      'Music and art composed in Finnish old-growth forests, aiming to raise awareness and protect threatened forests.',
    email: primaryEmail,
    sameAs: socialLinks.filter(({ href }) => !href.includes('linktr.ee')).map(({ href }) => href),
    funder: {
      '@type': 'Organization' as const,
      name: 'KONE Foundation',
    },
  };
}
