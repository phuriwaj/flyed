#!/usr/bin/env node
import { migrateBlogI18n } from '../src/lib/migrate-blog-i18n.ts';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const blogDir = join(__dirname, '../src/content/blog');

console.log(`[migrate] target: ${blogDir}`);
const result = migrateBlogI18n(blogDir);
console.log(`[migrate] migrated: ${result.migrated}, skipped: ${result.skipped}, errors: ${result.errors.length}`);
if (result.errors.length > 0) {
  for (const err of result.errors) console.error(`[migrate] ERROR: ${err}`);
  process.exit(1);
}
if (result.migrated > 0) {
  console.log('[migrate] done. Verify diff before committing.');
}
