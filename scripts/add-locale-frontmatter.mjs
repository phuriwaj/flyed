// One-shot migration: every src/content/blog/*.mdx post currently lacks
// a `locale` field. Insert `locale: en` or `locale: th` based on the
// filename suffix. Skip files that already declare a locale (idempotent).
//
// Run from project root:
//   node scripts/add-locale-frontmatter.mjs

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BLOG_DIR = path.resolve('src/content/blog');

const files = await readdir(BLOG_DIR);
const mdx = files.filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));

let inserted = 0;
let skipped = 0;
let failed = 0;

for (const file of mdx) {
  const full = path.join(BLOG_DIR, file);
  let text;
  try {
    text = await readFile(full, 'utf8');
  } catch (err) {
    console.error(`read failed: ${file} — ${err.message}`);
    failed++;
    continue;
  }

  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    console.warn(`no frontmatter block: ${file} (skipped)`);
    skipped++;
    continue;
  }

  const fm = match[1];
  if (/^locale:\s*(en|th)\s*$/m.test(fm)) {
    skipped++;
    continue;
  }

  let locale;
  if (file.endsWith('.en.mdx') || file.endsWith('.en.md')) locale = 'en';
  else if (file.endsWith('.th.mdx') || file.endsWith('.th.md')) locale = 'th';
  else {
    console.warn(`could not infer locale from filename: ${file} (skipped)`);
    skipped++;
    continue;
  }

  // Insert `locale: <x>` as the first key of the frontmatter block.
  const updated = text.replace(/^---\n/, `---\nlocale: ${locale}\n`);
  if (updated === text) {
    console.warn(`no change applied: ${file}`);
    skipped++;
    continue;
  }

  try {
    await writeFile(full, updated, 'utf8');
    inserted++;
  } catch (err) {
    console.error(`write failed: ${file} — ${err.message}`);
    failed++;
  }
}

console.log(`locale frontmatter migration: ${inserted} inserted, ${skipped} skipped, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);