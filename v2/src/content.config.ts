import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const artists = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/artists" }),
  schema: z.object({
    name: z.string(),
    role: z.enum(["music", "featured", "land-art", "soundscapes"]),
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
