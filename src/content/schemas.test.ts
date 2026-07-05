import { describe, it, expect } from 'vitest';

describe('content schemas', () => {
  it('exports collections object', async () => {
    const mod = await import('../content.config');
    expect(mod.collections).toBeDefined();
    expect(Object.keys(mod.collections).sort()).toEqual([
      'blog',
      'categories',
      'destinations',
      'itineraries',
      'team',
    ]);
  });
});
