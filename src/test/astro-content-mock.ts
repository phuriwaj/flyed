// Mock for astro:content in vitest context
import { z } from 'zod';

export const defineCollection = (config: any) => config;
export const reference = (col: string) => Object.assign(z.any(), { collection: col });
export { z };
