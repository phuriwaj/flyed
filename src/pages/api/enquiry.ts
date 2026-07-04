import type { APIRoute } from 'astro';
import { RESEND_API_KEY, CRM_WEBHOOK_URL, ENQUIRY_TO_EMAIL } from 'astro:env/server';
import { enquirySchema } from '@/components/EnquiryForm';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const { request } = ctx;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400 });
  }

  const result = enquirySchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ ok: false, error: 'Validation failed', issues: result.error.issues }), { status: 422 });
  }

  const enquiry = result.data;
  const enquiryId = crypto.randomUUID();

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
      ctx.logger.error(`Resend delivery failed [enquiryId=${enquiryId}]: ${e instanceof Error ? e.message : String(e)}`);
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
      ctx.logger.error(`CRM webhook failed [enquiryId=${enquiryId}]: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    ctx.logger.warn(`CRM_WEBHOOK_URL not configured; skipping CRM [enquiryId=${enquiryId}]`);
  }

  // 3. Always return success (we logged everything we could)
  return new Response(JSON.stringify({ ok: true, enquiryId }), {
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
