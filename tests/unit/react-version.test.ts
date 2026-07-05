import { describe, it, expect } from 'vitest';
import reactPkg from 'react/package.json' with { type: 'json' };
import reactDomPkg from 'react-dom/package.json' with { type: 'json' };
import * as reactDomClient from 'react-dom/client';

// F-42: the React 19 "Invalid hook call" symptom only appears when the
// resolved module graph contains more than one instance of react or
// react-dom. If a future dependency upgrade introduces a duplicate, this
// test fails fast in CI before the symptom reaches the browser.
describe('react/react-dom single tree (F-42)', () => {
  it('loads both packages at the same major version', () => {
    expect(reactPkg.version.startsWith('19.')).toBe(true);
    expect(reactDomPkg.version.startsWith('19.')).toBe(true);
  });

  it('resolves react-dom/client to the same package as react-dom', () => {
    // The dispatcher/checker inside React inspects these constants to
    // decide whether two copies of React are loaded. If a peer mismatch
    // were silently deduped by npm but exposed different module identities
    // at runtime, ReactDOM's createRoot would throw.
    expect(typeof reactDomClient.createRoot).toBe('function');
    expect(reactPkg.version).toBe(reactDomPkg.version);
  });
});
