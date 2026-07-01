import type { APIRoute } from 'astro';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), { status: 422 });
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return new Response(JSON.stringify({ ok: true, subscribed: true }), { status: 200 });
};
