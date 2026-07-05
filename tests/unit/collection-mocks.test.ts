import { describe, it, expect } from 'vitest';
import { getCollection, getEntry, reference, z, defineCollection } from 'astro:content';

// Smoke test for the realistic `astro:content` mock at
// tests/mocks/astro-content.ts. We cast through `any` liberally at the
// boundaries because the real `astro:content` virtual module narrows
// `getCollection(name)` to the `DataEntryMap` keys, but in this mock
// every collection is a plain array of fixtures — including ones the
// real schema doesn't know about (`does-not-exist`). Asserting on
// runtime behaviour is the point.

const asAny = (v: unknown): any => v;

describe('astro:content mock — basic surface', () => {
  it('exports defineCollection as a passthrough', () => {
    const cfg = asAny({ loader: 'glob', schema: z.object({ foo: z.string() }) });
    expect(defineCollection(cfg)).toBe(cfg);
  });

  it('exports `z` and `reference` helpers', () => {
    expect(z).toBeDefined();
    expect(typeof z.string).toBe('function');
    const ref = reference('team') as { collection?: string };
    expect(ref.collection).toBe('team');
  });
});

describe('astro:content mock — getCollection fixtures', () => {
  it('returns at least one entry per collection declared in src/content.config.ts', async () => {
    const collections = ['blog', 'itineraries', 'destinations', 'categories', 'team'];
    for (const name of collections) {
      const entries = await getCollection(asAny(name));
      expect(entries.length, `${name} should return >=1 fixture`).toBeGreaterThan(0);
    }
  });

  it('blog fixtures declare a `locale` field (post-merger schema)', async () => {
    const posts = await getCollection('blog');
    for (const post of posts) {
      expect(typeof post.id).toBe('string');
      expect(['en', 'th']).toContain(post.data.locale);
      expect(post.id.endsWith(`.${post.data.locale}`)).toBe(true);
    }
  });

  it('blog fixtures parse their pubDate as Date objects (matches z.coerce.date())', async () => {
    const posts = await getCollection('blog');
    for (const post of posts) {
      expect(post.data.pubDate).toBeInstanceOf(Date);
      expect(Number.isNaN(post.data.pubDate.getTime())).toBe(false);
    }
  });

  it('itinerary fixtures include destinations, days, and priceFrom', async () => {
    const itineraries = await getCollection('itineraries');
    expect(itineraries.length).toBeGreaterThan(0);
    const sample = itineraries[0];
    expect(sample.data.title).toBeTypeOf('string');
    expect(Array.isArray(sample.data.destinations)).toBe(true);
    expect(sample.data.days).toBeTypeOf('number');
    expect(sample.data.priceFrom).toBeTypeOf('number');
    expect(sample.data.currency).toBe('USD');
    expect(sample.data.slug).toBe(sample.id);
  });

  it('destination fixtures include EN + TH names and a region', async () => {
    const destinations = await getCollection('destinations');
    const d = destinations[0];
    expect(d.data.name).toBeTypeOf('string');
    expect(d.data.nameTh).toBeTypeOf('string');
    expect(['North', 'Central', 'Andaman', 'Gulf', 'Northeast']).toContain(d.data.region);
  });

  it('category fixtures expose both EN and TH titles + a color enum', async () => {
    const categories = await getCollection('categories');
    const c = categories[0];
    expect(c.data.title).toBeTypeOf('string');
    expect(c.data.titleTh).toBeTypeOf('string');
    expect(['teak', 'bamboo', 'sunset', 'gold']).toContain(c.data.color);
  });

  it('team fixtures carry a role, photo, and ordering field', async () => {
    const team = await getCollection('team');
    const t = team[0];
    expect(t.data.name).toBeTypeOf('string');
    expect(t.data.role).toBeTypeOf('string');
    expect(t.data.photo).toBeTypeOf('string');
    expect(t.data.order).toBeTypeOf('number');
  });

  it('returns [] for an unknown collection', async () => {
    const entries = await getCollection(asAny('does-not-exist'));
    expect(entries).toEqual([]);
  });
});

describe('astro:content mock — filter predicate', () => {
  it('applies an optional filter (the pattern used by rss.xml.ts and blog routes)', async () => {
    const draftFilter: any = ({ data }: { data: { draft: boolean } }) => Boolean(data.draft);
    const drafts = await getCollection('blog', draftFilter);
    expect(drafts.length).toBe(0); // fixture set has no drafts

    const publishedFilter: any = ({ data }: { data: { draft: boolean } }) => !data.draft;
    const published = await getCollection('blog', publishedFilter);
    expect(published.length).toBeGreaterThan(0);
  });

  it('locale-filter pattern matches the EN blog routes', async () => {
    const enFilter: any = ({ data }: { data: { locale: string } }) => data.locale === 'en';
    const enPosts = await getCollection('blog', enFilter);
    expect(enPosts.length).toBeGreaterThan(0);
    for (const post of enPosts) {
      expect(post.data.locale).toBe('en');
      expect(post.id.endsWith('.en')).toBe(true);
    }
  });
});

describe('astro:content mock — getEntry reference resolution', () => {
  it('resolves a blog author reference (used in src/pages/blog/[slug].astro)', async () => {
    const posts = await getCollection('blog');
    const post = posts.find((p) => p.data.locale === 'en')!;
    // The reference value in fixtures is a plain string id, mimicking
    // frontmatter like `author: kriengsak`.
    const author = await getEntry(asAny(post.data.author));
    expect(author).toBeDefined();

    expect((author as any).data.name).toBeTypeOf('string');
  });

  it('resolves a relatedItineraries reference', async () => {
    const posts = await getCollection('blog');
    const post = posts.find((p) => p.data.locale === 'en')!;
    const refSlug = String((post.data.relatedItineraries as unknown[])[0]);
    const itin = await getEntry(asAny(refSlug));
    expect(itin).toBeDefined();

    expect((itin as any).data.days).toBeTypeOf('number');
  });

  it('returns undefined for an unknown id', async () => {
    const missing = await getEntry(asAny('does-not-exist'));
    expect(missing).toBeUndefined();
  });
});
