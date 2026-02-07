import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).optional(),
    cover: z.string().optional(),
    readTime: z.string().optional(),
  }),
});

export const collections = { blog };
