import { defineCollection, z } from 'astro:content';

const linkSchema = z.object({
  anchorText: z.string(),
  targetURL: z.string(),
  contextQuote: z.string().optional(),
  valueProp: z.string().optional(),
});

const termsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date().optional(),
    category: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    related: z.array(z.string()).optional(),
    links: z.array(linkSchema).optional(),
  }),
});

const historyCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date().optional(),
    category: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    related: z.array(z.string()).optional(),
    links: z.array(linkSchema).optional(),
  }),
});

export const collections = {
  'terms': termsCollection,
  'history': historyCollection,
};