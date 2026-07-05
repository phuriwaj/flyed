import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { migrateBlogI18n } from './migrate-blog-i18n';

const fixtureDir = join(tmpdir(), `migrate-test-${Date.now()}`);

beforeEach(() => {
  mkdirSync(fixtureDir, { recursive: true });
  writeFileSync(
    join(fixtureDir, 'post-one.mdx'),
    `---
title: Post One
description: First post
pubDate: 2026-06-15
heroImage: /img/a.jpg
---

# Post One Body

English body content here.`,
  );
  writeFileSync(
    join(fixtureDir, 'post-two.mdx'),
    `---
title: Post Two
description: Second post
pubDate: 2026-06-20
heroImage: /img/b.jpg
---

Body of post two.`,
  );
});

afterEach(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

describe('migrateBlogI18n', () => {
  it('splits each *.mdx into *.en.mdx and *.th.mdx', () => {
    const result = migrateBlogI18n(fixtureDir);
    expect(result.migrated).toBe(2);
    expect(result.skipped).toBe(0);
    expect(existsSync(join(fixtureDir, 'post-one.en.mdx'))).toBe(true);
    expect(existsSync(join(fixtureDir, 'post-one.th.mdx'))).toBe(true);
    expect(existsSync(join(fixtureDir, 'post-two.en.mdx'))).toBe(true);
    expect(existsSync(join(fixtureDir, 'post-two.th.mdx'))).toBe(true);
  });

  it('deletes original *.mdx file', () => {
    migrateBlogI18n(fixtureDir);
    expect(existsSync(join(fixtureDir, 'post-one.mdx'))).toBe(false);
    expect(existsSync(join(fixtureDir, 'post-two.mdx'))).toBe(false);
  });

  it('preserves frontmatter in *.en.mdx', () => {
    migrateBlogI18n(fixtureDir);
    const en = readFileSync(join(fixtureDir, 'post-one.en.mdx'), 'utf8');
    expect(en).toContain('title: Post One');
    expect(en).toContain('description: First post');
    expect(en).toContain('pubDate: 2026-06-15');
  });

  it('marks *.th.mdx as draft with TODO marker', () => {
    migrateBlogI18n(fixtureDir);
    const th = readFileSync(join(fixtureDir, 'post-one.th.mdx'), 'utf8');
    expect(th).toContain('draft: true');
    expect(th).toContain('TODO(editor)');
    expect(th).toContain('title: Post One'); // frontmatter copied as-is
  });

  it('is idempotent: re-running on already-split files is a no-op', () => {
    const first = migrateBlogI18n(fixtureDir);
    const second = migrateBlogI18n(fixtureDir);
    expect(first.migrated).toBe(2);
    expect(second.migrated).toBe(0);
    expect(second.skipped).toBe(2);
  });
});
