import { readdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

export interface MigrateResult {
  migrated: number;
  skipped: number;
  errors: string[];
}

export function migrateBlogI18n(dir: string): MigrateResult {
  const result: MigrateResult = { migrated: 0, skipped: 0, errors: [] };
  const files = readdirSync(dir);
  const mdxFiles = files.filter(
    (f) => f.endsWith('.mdx') && !f.endsWith('.en.mdx') && !f.endsWith('.th.mdx'),
  );

  for (const file of mdxFiles) {
    const srcPath = join(dir, file);
    const slug = file.replace(/\.mdx$/, '');
    const enPath = join(dir, `${slug}.en.mdx`);
    const thPath = join(dir, `${slug}.th.mdx`);

    try {
      const raw = readFileSync(srcPath, 'utf8');
      const parsed = matter(raw);

      // English version: original content, original draft flag
      const enContent = matter.stringify(parsed.content, parsed.data);
      const enTemp = `${enPath}.new`;
      writeFileSync(enTemp, enContent);
      renameSync(enTemp, enPath);

      // Thai version: copy frontmatter, prepend TODO, mark draft: true
      const thData = { ...parsed.data, draft: true };
      const thBody = `{/* TODO(editor): translate this post to Thai. Set draft: false when done. */}\n\n${parsed.content}`;
      const thContent = matter.stringify(thBody, thData);
      const thTemp = `${thPath}.new`;
      writeFileSync(thTemp, thContent);
      renameSync(thTemp, thPath);

      // Delete original
      unlinkSync(srcPath);

      result.migrated++;
    } catch (err) {
      result.errors.push(`${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Count skipped: pre-existing language file pairs (not created by this run)
  // Each original .mdx produces 1 pair; skip pairs that existed before this run
  const preExistingPairs = Math.floor(
    files.filter((f) => f.endsWith('.en.mdx') || f.endsWith('.th.mdx')).length / 2,
  );
  result.skipped = Math.max(0, preExistingPairs - result.migrated);

  return result;
}
