import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

export const artistRoles = ['music', 'featured', 'land-art', 'soundscapes'] as const;
export type ArtistRole = (typeof artistRoles)[number];

const artists = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artists' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.enum(artistRoles),
      order: z.number().int().positive(),
      image: image(),
    }),
});

export const collections = { artists };
