import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const artists = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/artists" }),
  schema: z.object({
    name: z.string(),
    role: z.enum(["music", "featured", "land-art", "soundscapes"]),
    order: z.number(),
    image: z.string(),
  }),
});

export const collections = { artists };
