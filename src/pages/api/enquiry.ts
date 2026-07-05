import type { APIRoute } from 'astro';
import { RESEND_API_KEY, CRM_WEBHOOK_URL, ENQUIRY_TO_EMAIL } from 'astro:env/server';
import { enquirySchema } from '@/components/EnquiryForm';
import { rateLimited } from '@/lib/rate-limit';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const { request, locals } = ctx;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400 });
  }

  const result = enquirySchema.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Validation failed', issues: result.error.issues }),
      { status: 422 },
    );
  }

  // Rate-limit AFTER validation (junk requests don't burn KV ops) and BEFORE
  // generating an enquiryId or dispatching to Resend/CRM. Cloudflare Workers
  // attaches the client IP as `cf-connecting-ip`; fall back to the standard
  // `x-forwarded-for` chain (first hop only) and finally to `unknown` for
  // local astro dev / vitest / any non-CF-proxied request.
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  const rateLimitKv = (locals as { runtime?: { env?: { RATE_LIMIT_KV?: unknown } } } | undefined)
    ?.runtime?.env?.RATE_LIMIT_KV as Parameters<typeof rateLimited>[0]['kv'];
  const limit = await rateLimited({
    ip,
    kv: rateLimitKv,
    max: 5,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    ctx.logger.warn(`Rate limit exceeded [ip=${ip}]`);
    return new Response(JSON.stringify({ ok: false, error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Retry-After': String(limit.retryAfterSec) },
    });
  }

  const enquiry = result.data;
  const enquiryId = crypto.randomUUID();

  // 0. Persist to KV before downstream dispatch so a Resend/CRM failure
  // doesn't lose the lead. `locals` is absent in unit tests; in local dev
  // the binding is also absent (no wrangler runtime) — both fall through.
  // `persisted` tracks whether the write ACTUALLY landed (binding present AND
  // put() resolved without throwing). The catch block below keeps the lead in
  // the request logs but does not flip the flag back to true.
  const leadsKv = (locals as any)?.runtime?.env?.LEADS_KV;
  let persisted = false;
  if (leadsKv) {
    try {
      await leadsKv.put(
        enquiryId,
        JSON.stringify({ enquiry, createdAt: new Date().toISOString() }),
        { expirationTtl: 60 * 60 * 24 * 30 }, // 30d retry window
      );
      persisted = true;
    } catch (e) {
      ctx.logger.error(
        `LEADS_KV put failed [enquiryId=${enquiryId}]: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  } else {
    ctx.logger.warn(`LEADS_KV not bound; enquiry not durably persisted [enquiryId=${enquiryId}]`);
  }

  // 1. Send email via Resend (best-effort; never blocks success)
  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'flyed website <noreply@flyed.dev>',
          to: [ENQUIRY_TO_EMAIL],
          subject: `New enquiry: ${enquiry.schoolName} (${enquiry.groupSize} students)`,
          html: renderEmail(enquiry, enquiryId),
        }),
      });
    } catch (e) {
      ctx.logger.error(
        `Resend delivery failed [enquiryId=${enquiryId}]: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  } else {
    ctx.logger.warn(`RESEND_API_KEY not configured; skipping email send [enquiryId=${enquiryId}]`);
  }

  // 2. POST to CRM webhook (best-effort)
  if (CRM_WEBHOOK_URL) {
    try {
      await fetch(CRM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...enquiry, enquiryId }),
      });
    } catch (e) {
      ctx.logger.error(
        `CRM webhook failed [enquiryId=${enquiryId}]: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  } else {
    ctx.logger.warn(`CRM_WEBHOOK_URL not configured; skipping CRM [enquiryId=${enquiryId}]`);
  }

  // 3. Always return success (we logged everything we could).
  // `durable` reflects whether the lead ACTUALLY landed in KV (binding present
  // AND put() resolved). It's `false` when the binding is missing OR when the
  // write threw — both signal that the lead has no durable copy and downstream
  // dispatch was best-effort only.
  return new Response(JSON.stringify({ ok: true, enquiryId, durable: persisted }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

function renderEmail(e: typeof enquirySchema._type, id: string): string {
  return `
    <h2>New school-trip enquiry</h2>
    <p><strong>Enquiry ID:</strong> ${id}</p>
    <p><strong>School:</strong> ${e.schoolName} (${e.country})</p>
    <p><strong>Contact:</strong> ${e.role} — ${e.email} — ${e.phone}</p>
    <p><strong>Group:</strong> ${e.groupSize} students, ages ${e.ages}</p>
    <p><strong>Travel:</strong> ${e.departureMonth}, ${e.duration} days</p>
    <p><strong>Subjects:</strong> ${e.subjects.join(', ')}</p>
    <p><strong>Curriculum:</strong> ${e.curriculum ?? '—'}</p>
    <p><strong>Destinations:</strong> ${e.destinations?.join(', ') ?? 'flyed chooses'}</p>
    <p><strong>Itinerary:</strong> ${e.itinerary ?? '—'}</p>
    <p><strong>Notes:</strong><br/>${e.notes ?? '—'}</p>
  `;
}
