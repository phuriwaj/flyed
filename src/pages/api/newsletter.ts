import type { APIRoute } from 'astro';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), { status: 422 });
  }

  // Real implementation would call Mailchimp/Resend/ConvertKit here
  // const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
  // const NEWSLETTER_LIST = import.meta.env.NEWSLETTER_LIST ?? 'subscribers';
  // if (RESEND_API_KEY) {
  //   await fetch(`https://api.resend.com/audiences/${NEWSLETTER_LIST}/contacts`, { ... });
  // }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return new Response(JSON.stringify({ ok: true, subscribed: true }), { status: 200 });
};
