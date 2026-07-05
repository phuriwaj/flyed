import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

// Mirrors src/content.config.ts: the merged `blog` collection's schema.
// If the real schema changes, update this in lockstep (the test catches
// a divergence between the deployed schema and the migration assumptions).
const blogSchema = z.object({
  locale: z.enum(['en', 'th']),
  title: z.string().max(120),
  description: z.string().max(180),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  author: z.any(),
  tags: z.array(z.string()),
  heroImage: z.string(),
  relatedItineraries: z.array(z.any()).default([]),
  draft: z.boolean().default(false),
});

// Minimal frontmatter parser sufficient for the Astro `---` block.
// We don't need to round-trip YAML — we only need to assert the migration
// script wrote the `locale` key for every post and that it parses cleanly.
function parseFrontmatter(src: string): Record<string, unknown> | null {
  const match = src.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm: Record<string, unknown> = {};
  const lines = match[1].split('\n');
  let currentKey: string | null = null;
  let listIndent = false;
  for (const line of lines) {
    if (line.startsWith('  - ')) {
      const v = line.slice(4).trim();
      if (currentKey && Array.isArray(fm[currentKey])) {
        (fm[currentKey] as unknown[]).push(v);
      }
      listIndent = true;
      continue;
    }
    listIndent = false;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const raw = m[2].trim();
    if (raw === '') {
      fm[key] = [];
      currentKey = key;
    } else if (raw === 'true' || raw === 'false') {
      fm[key] = raw === 'true';
      currentKey = null;
    } else {
      // Strip surrounding quotes
      fm[key] = raw.replace(/^['"]|['"]$/g, '');
      currentKey = null;
    }
  }
  // ignore unused vars
  void listIndent;
  return fm;
}

const BLOG_DIR = path.resolve(__dirname, '../../src/content/blog');

describe('blog collection: locale migration', () => {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));

  it('discovers at least one EN and one TH post', () => {
    expect(files.some((f) => f.endsWith('.en.mdx'))).toBe(true);
    expect(files.some((f) => f.endsWith('.th.mdx'))).toBe(true);
  });

  it('every blog post declares a `locale` field matching its filename suffix', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const fm = parseFrontmatter(src);
      if (!fm) {
        offenders.push(`${file}: no frontmatter`);
        continue;
      }
      if (!('locale' in fm)) {
        offenders.push(`${file}: missing locale`);
        continue;
      }
      const expected = file.endsWith('.en.mdx') || file.endsWith('.en.md') ? 'en' : 'th';
      if (fm.locale !== expected) {
        offenders.push(`${file}: locale=${fm.locale}, expected ${expected}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every blog post parses against the merged schema', () => {
    const failures: string[] = [];
    for (const file of files) {
      const src = readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const fm = parseFrontmatter(src);
      if (!fm) {
        failures.push(`${file}: no frontmatter`);
        continue;
      }
      const result = blogSchema.safeParse(fm);
      if (!result.success) {
        failures.push(`${file}: ${result.error.issues.map((i) => i.message).join('; ')}`);
      }
    }
    expect(failures).toEqual([]);
  });
});

describe('blog schema: locale field', () => {
  it('rejects an unknown locale', () => {
    const r = blogSchema.safeParse({
      locale: 'fr',
      title: 'x',
      description: 'y',
      pubDate: '2026-01-01',
      author: 'kriengsak',
      tags: ['Service'],
      heroImage: '/img.jpg',
    });
    expect(r.success).toBe(false);
  });

  it('coerces a string pubDate to Date', () => {
    const r = blogSchema.safeParse({
      locale: 'en',
      title: 'x',
      description: 'y',
      pubDate: '2026-06-15T00:00:00.000Z',
      author: 'kriengsak',
      tags: ['Service'],
      heroImage: '/img.jpg',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.pubDate).toBeInstanceOf(Date);
  });
});
