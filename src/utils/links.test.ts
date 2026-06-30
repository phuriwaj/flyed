import { describe, it, expect } from 'vitest';
import { localizedPath, categoryPath, destinationPath, itineraryPath, blogPath } from './links';

describe('link utilities', () => {
  it('localizedPath adds /th prefix for th locale', () => {
    expect(localizedPath('en', '/about')).toBe('/about');
    expect(localizedPath('th', '/about')).toBe('/th/about');
    expect(localizedPath('th', '/')).toBe('/th');
  });

  it('categoryPath returns /trips/{slug}', () => {
    expect(categoryPath('service-learning')).toBe('/trips/service-learning');
    expect(categoryPath('service-learning', 'th')).toBe('/th/trips/service-learning');
  });

  it('destinationPath returns /destinations/{slug}', () => {
    expect(destinationPath('bangkok')).toBe('/destinations/bangkok');
  });

  it('itineraryPath returns /itineraries/{slug}', () => {
    expect(itineraryPath('foo-bar')).toBe('/itineraries/foo-bar');
  });

  it('blogPath returns /blog/{slug}', () => {
    expect(blogPath('hello')).toBe('/blog/hello');
  });
});
