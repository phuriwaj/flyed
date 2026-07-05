// Realistic mock of the 'astro:content' virtual module for Vitest.
//
// Mirrors the surface used by src/content.config.ts and the dynamic
// routes under src/pages (e.g. blog/[slug].astro, itineraries/[slug].astro):
//   - defineCollection, z, reference — passthroughs and shims that let
//     defineCollection({ loader, schema }) return a value consumers can
//     introspect without needing a real Zod schema at runtime.
//   - getCollection(name, filter?) — returns at least one realistic
//     fixture per collection declared in src/content.config.ts. Filter
//     is the optional predicate Astro passes (e.g. a draft predicate).
//   - getEntry(ref) — looks up a single entry by its id, accepting
//     either a reference object with collection+id or a string id.
//   - render(entry) — returns a Content component that surfaces the
//     fixture's body string (matches Astro's entry.body / Content API
//     used in dynamic slug routes).
//
// Fixtures conform to the schemas declared in src/content.config.ts
// (blog with locale, itineraries with destinations/days/priceFrom, etc).
// They mirror real entries in src/content/ so consumers that read the
// mock under test see plausible values rather than an empty array.
import { z } from 'zod';

// --------------------------------------------------------------------------
// defineCollection / reference shims
// --------------------------------------------------------------------------

export { z };

export const defineCollection = <T>(config: T): T => config;

export function reference(collectionName: string): unknown {
  // Real `reference('team')` returns a Zod schema with a `.collection`
  // property; tests only need a stable placeholder shape.
  return Object.assign(z.any(), { collection: collectionName });
}

// --------------------------------------------------------------------------
// Fixtures — at least one entry per collection declared in
// `src/content.config.ts`. Each entry has the `id` + `data` shape Astro
// emits from a glob loader.
// --------------------------------------------------------------------------

const blogFixtures = [
  {
    id: '01-why-thailand-service-learning.en',
    data: {
      locale: 'en' as const,
      title: "Why Thailand is the world's best classroom for service learning",
      description:
        'Five structural reasons Thailand outperforms other destinations for IB MYP service and CAS programs.',
      pubDate: new Date('2026-06-15T00:00:00.000Z'),
      author: 'kriengsak',
      tags: ['Service', 'Curriculum'],
      heroImage: '/images/blog/01-service-learning-hero.jpg',
      relatedItineraries: ['northern-thailand-service-week'],
      draft: false,
    },
    body: "# Why Thailand is the world's best classroom for service learning\n\nThailand has quietly become the world's most popular destination for IB service learning...",
  },
  {
    id: '01-why-thailand-service-learning.th',
    data: {
      locale: 'th' as const,
      title: 'ทำไมไทยถึงเป็นห้องเรียนที่ดีที่สุดในโลกสำหรับการเรียนรู้ผ่านจิตอาสา',
      description:
        'เหตุผลเชิงโครงสร้างห้าประการที่ทำให้ไทยเหนือกว่าจุดหมายปลายทางอื่นสำหรับโปรแกรม IB MYP และ CAS',
      pubDate: new Date('2026-06-15T00:00:00.000Z'),
      author: 'kriengsak',
      tags: ['Service', 'Curriculum'],
      heroImage: '/images/blog/01-service-learning-hero.jpg',
      relatedItineraries: ['northern-thailand-service-week'],
      draft: false,
    },
    body: '# ทำไมไทยถึงเป็นห้องเรียนที่ดีที่สุดในโลก\n\nประเทศไทยกลายเป็นจุดหมายปลายทางยอดนิยมของโลกสำหรับการเรียนรู้ผ่านจิตอาสาของ IB อย่างเงียบ ๆ...',
  },
];

const itineraryFixtures = [
  {
    id: 'northern-thailand-service-week',
    data: {
      title: 'Northern Thailand Service Week',
      description:
        'Seven-day service-learning immersion in Chiang Mai and Chiang Rai — bamboo construction, hill-tribe English teaching, ethical elephant sanctuary.',
      category: 'service-learning' as const,
      destinations: ['chiang-mai', 'chiang-rai'],
      days: 7,
      groupSize: { min: 12, max: 32 },
      ageBand: { min: 14, max: 18 },
      priceFrom: 1850,
      currency: 'USD' as const,
      startMonths: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
      curricula: ['IB-MYP', 'IB-DP', 'IGCSE', 'GCSE'],
      heroImage: '/images/itineraries/northern-thailand-service-week-hero.jpg',
      gallery: [
        '/images/itineraries/ntsw-1.jpg',
        '/images/itineraries/ntsw-2.jpg',
        '/images/itineraries/ntsw-3.jpg',
      ],
      slug: 'northern-thailand-service-week',
      published: true,
    },
    body: '## Day 1 — Arrival Chiang Mai\n\nArrive Chiang Mai International Airport...',
  },
];

const destinationFixtures = [
  {
    id: 'chiang-mai',
    data: {
      name: 'Chiang Mai',
      nameTh: 'เชียงใหม่',
      tagline: "Northern Thailand's cultural heart — temples, night markets, and mountain forests",
      region: 'North' as const,
      bestFor: ['service-learning', 'stem-environmental', 'language-immersion'],
      bestMonths: ['Nov', 'Dec', 'Jan', 'Feb'],
      heroImage: '/images/destinations/chiang-mai-hero.jpg',
      intro: 'Chiang Mai is our most-booked destination after Bangkok...',
      slug: 'chiang-mai',
    },
    body: '## Why flyed runs Chiang Mai trips\n\nOur Chiang Mai program started in 2016...',
  },
];

const categoryFixtures = [
  {
    id: 'cultural-heritage',
    data: {
      title: 'Cultural & Heritage',
      titleTh: 'วัฒนธรรมและมรดก',
      description:
        'Temple homestays, Isan village immersion, Bangkok old-town walks, and Thai cooking from scratch.',
      icon: '🏛️',
      color: 'sunset' as const,
      itineraryCount: 1,
      slug: 'cultural-heritage',
    },
    body: '',
  },
];

const teamFixtures = [
  {
    id: 'kriengsak',
    data: {
      name: 'Kriengsak Wongthong',
      role: 'Co-founder & Managing Director',
      roleTh: 'ผู้ร่วมก่อตั้งและกรรมการผู้จัดการ',
      bio: 'Former K-12 teacher with 20 years in Chiang Mai education. Started flyed in 2012 after seeing too many school trips run as tourism, not learning.',
      photo: '/images/team/kriengsak.jpg',
      order: 1,
    },
    body: '',
  },
];

// Map of collection name -> fixtures. Use `Object.freeze` so tests can
// detect accidental mutation.
const FIXTURES: Record<string, unknown[]> = Object.freeze({
  blog: blogFixtures,
  itineraries: itineraryFixtures,
  destinations: destinationFixtures,
  categories: categoryFixtures,
  team: teamFixtures,
});

// --------------------------------------------------------------------------
// getCollection / getEntry / render
// --------------------------------------------------------------------------

type CollectionEntry = {
  id: string;
  data: Record<string, unknown>;
  body?: string;
};

type Filter = (entry: CollectionEntry) => boolean;

export async function getCollection(name: string, filter?: Filter): Promise<CollectionEntry[]> {
  const all = (FIXTURES[name] as CollectionEntry[] | undefined) ?? [];
  return filter ? all.filter(filter) : all;
}

type ReferenceArg = string | { collection?: string; id: string };

function extractId(arg: ReferenceArg | ReferenceArg[]): string {
  if (Array.isArray(arg)) {
    // The 2-tuple form is [CollectionName, ReferenceArg]
    const second = arg[1];
    return typeof second === 'string' ? second : second.id;
  }
  if (typeof arg === 'string') return arg;
  return arg.id;
}

export async function getEntry(
  ref: ReferenceArg | ReferenceArg[],
): Promise<CollectionEntry | undefined> {
  const id = extractId(ref);
  const flat = Object.values(FIXTURES).flat() as CollectionEntry[];
  return flat.find((e) => e.id === id);
}

interface RenderResult {
  Content: () => unknown;
}

export function render(entry: CollectionEntry): RenderResult {
  return {
    Content: () => entry.body ?? '',
  };
}
