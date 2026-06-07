import { defineCollection, z } from 'astro:content';

// Blog = dnevni "roundup" post. Vsak dan en nov post, ki referencira
// ASIN-e tega dne (produkti se razrešijo iz src/data/products.json).
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    asins: z.array(z.string()).default([]),
    cover: z.string().optional(), // pot do naslovne slike (npr. /img/<slug>.jpg)
  }),
});

export const collections = { blog };
