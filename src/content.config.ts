import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import type { Loader } from 'astro/loaders';

function emptyLoader(): Loader {
  return {
    name: 'empty',
    load: async ({ store }) => {
      store.clear();
    },
  };
}

const categoryEnum = z.enum([
  'service-learning',
  'cultural-heritage',
  'stem-environmental',
  'sports-adventure',
  'language-immersion',
  'history-heritage',
]);

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(120),
    description: z.string().max(180),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: reference('team'),
    tags: z.array(z.enum(['Service','Cultural','STEM','Sports','Language','History','Curriculum','Safety','Brand','Educator'])),
    heroImage: z.string(),
    relatedItineraries: z.array(reference('itineraries')).default([]),
    draft: z.boolean().default(false),
  }),
});

const itineraries = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/itineraries' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    category: categoryEnum,
    destinations: z.array(reference('destinations')),
    days: z.number().int().positive(),
    groupSize: z.object({ min: z.number().int(), max: z.number().int() }),
    ageBand: z.object({ min: z.number().int(), max: z.number().int() }),
    priceFrom: z.number().int().positive(),
    currency: z.literal('USD'),
    startMonths: z.array(z.enum(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])).min(1),
    curricula: z.array(z.enum(['IB-MYP','IB-DP','IGCSE','A-Level','AP','GCSE','Bilingual'])),
    heroImage: z.string(),
    gallery: z.array(z.string()).default([]),
    slug: z.string(),
    published: z.boolean().default(true),
  }),
});

const destinations = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/destinations' }),
  schema: z.object({
    name: z.string(),
    nameTh: z.string(),
    tagline: z.string().max(120),
    region: z.enum(['North','Central','Andaman','Gulf','Northeast']),
    bestFor: z.array(categoryEnum),
    bestMonths: z.array(z.enum(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])),
    heroImage: z.string(),
    intro: z.string(),
    slug: z.string(),
  }),
});

const categories = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/categories' }),
  schema: z.object({
    title: z.string(),
    titleTh: z.string(),
    description: z.string(),
    icon: z.string(),
    color: z.enum(['teak','bamboo','sunset','gold']),
    itineraryCount: z.number().int().nonnegative(),
    slug: z.string(),
  }),
});

const team = defineCollection({
  loader: emptyLoader(),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    roleTh: z.string().optional(),
    bio: z.string().max(400),
    photo: z.string(),
    order: z.number().int(),
  }),
});

const testimonials = defineCollection({
  loader: emptyLoader(),
  schema: z.object({
    quote: z.string().max(300),
    author: z.string(),
    role: z.string(),
    school: z.string(),
    city: z.string(),
    country: z.string(),
    itinerary: reference('itineraries').optional(),
  }),
});

export const collections = { blog, itineraries, destinations, categories, team, testimonials };
