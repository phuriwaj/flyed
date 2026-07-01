import type { APIRoute } from 'astro';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ ok: false }), { status: 422 });
  }
  // (No logging in production to avoid leaking form data)
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
