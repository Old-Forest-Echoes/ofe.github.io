import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

export const artistRoles = [
  "music",
  "featured",
  "land-art",
  "soundscapes",
] as const;
export type ArtistRole = (typeof artistRoles)[number];

const artists = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/artists" }),
  schema: z.object({
    name: z.string(),
    role: z.enum(artistRoles),
    order: z.number().int().positive(),
    image: z
      .string()
      .regex(
        /^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/,
        "Must be a safe filename ending in .jpg, .jpeg, .png, or .webp",
      ),
  }),
});

export const collections = { artists };
