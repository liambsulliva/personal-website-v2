import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const otherWork = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/other-work" }),
  schema: z.object({
    title: z.string(),
    type: z.string(),
    date: z.coerce.date(),
    link: z.string(),
    externalLink: z.boolean().default(false),
    image: z.string().optional(),
    description: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { otherWork };
