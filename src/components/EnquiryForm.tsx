import { useState } from 'react';
import { z } from 'zod';

export const enquirySchema = z.object({
  schoolName: z.string().min(2, 'School / organization name required'),
  role: z.string().min(2, 'Your role is required'),
  email: z.string().min(1, 'Email is required').pipe(z.string().email('Please enter a valid email')),
  phone: z.string().min(6, 'Phone number required'),
  country: z.string().min(2, 'Country is required'),
  groupSize: z.coerce.number().int().min(4, 'between 4 and 60').max(60, 'between 4 and 60'),
  ages: z.string().min(2, 'Ages / grades required'),
  departureMonth: z.string().min(2, 'Departure month required'),
  duration: z.coerce.number().int().min(2, 'Minimum 2 days').max(30, 'Maximum 30 days'),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  curriculum: z.string().optional(),
  destinations: z.array(z.string()).optional(),
  itinerary: z.string().optional(),
  notes: z.string().optional(),
});

export type EnquiryData = z.infer<typeof enquirySchema>;

const categoryOptions = [
  { value: 'service-learning', label: 'Service Learning' },
  { value: 'cultural-heritage', label: 'Cultural & Heritage' },
  { value: 'stem-environmental', label: 'STEM & Environmental' },
  { value: 'sports-adventure', label: 'Sports & Adventure' },
  { value: 'language-immersion', label: 'Language Immersion' },
  { value: 'history-heritage', label: 'History & Heritage' },
];

const destinationOptions = [
  'Bangkok','Chiang Mai','Chiang Rai','Phuket','Krabi','Khao Sok','Kanchanaburi','Ayutthaya','Koh Tao','Sukhothai','Pai','Isan',
];

const inputClass = 'mt-1 w-full h-11 px-5 rounded-pill bg-canvas text-body text-ink border border-[rgba(0,0,0,0.08)] focus:outline-none focus:border-primary transition-colors duration-150';
const textareaClass = 'mt-1 w-full px-5 py-3 rounded-lg bg-canvas text-body text-ink border border-[rgba(0,0,0,0.08)] focus:outline-none focus:border-primary transition-colors duration-150';

interface Props {
  defaults?: Partial<EnquiryData>;
  locale?: 'en' | 'th';
}

export default function EnquiryForm({ defaults = {}, locale = 'en' }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<EnquiryData>>(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const stepFields: (keyof EnquiryData)[][] = [
    ['groupSize','ages','departureMonth','duration','schoolName','role','email','phone','country'],
    ['subjects'],
    ['destinations'],
    ['notes'],
    [],
  ];

  const stepSchemas = stepFields.map((fields) => {
    if (fields.length === 0) return z.object({});
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const f of fields) {
      shape[f] = (enquirySchema.shape as Record<string, z.ZodTypeAny>)[f];
    }
    return z.object(shape);
  });

  const validateStep = (): boolean => {
    const stepData: any = {};
    for (const f of stepFields[step]) stepData[f] = (data as any)[f] ?? '';
    const result = stepSchemas[step].safeParse(stepData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errs[issue.path.join('.')] = issue.message;
      }
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, stepFields.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = enquirySchema.safeParse(data);
      if (!result.success) {
        setSubmitError('Please review the form for errors.');
        setSubmitting(false);
        return;
      }
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) {
        if (res.status === 422) {
          const body = await res.json().catch(() => null);
          if (body && Array.isArray(body.issues) && body.issues.length > 0) {
            const first = body.issues[0];
            const field = Array.isArray(first?.path) ? first.path.join('.') : '';
            const msg = first?.message ?? 'Validation failed';
            setSubmitError(field ? `${field}: ${msg}` : msg);
            setSubmitting(false);
            return;
          }
        }
        throw new Error(`HTTP ${res.status}`);
      }
      setSubmitted(true);
    } catch (e) {
      setSubmitError(locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง' : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-canvas-parchment p-8 rounded-lg border border-hairline text-center">
        <h2 className="text-display-md text-ink">
          {locale === 'th' ? 'ขอบคุณ!' : 'Thanks!'}
        </h2>
        <p className="mt-2 text-body text-ink-muted-80">
          {locale === 'th' ? 'เราจะติดต่อกลับภายใน 1 วันทำการ' : "We'll be in touch within one business day."}
        </p>
      </div>
    );
  }

  const Field = ({ name, label, type = 'text', required = true }: { name: keyof EnquiryData; label: string; type?: string; required?: boolean }) => (
    <label className="block" htmlFor={name}>
      <span className="text-caption-strong text-ink">{label}{required && ' *'}</span>
      <input
        id={name}
        type={type}
        value={(data[name] as string) ?? ''}
        onChange={(e) => setData((d) => ({ ...d, [name]: e.target.value }))}
        aria-invalid={Boolean(errors[name]) || undefined}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        aria-required={required || undefined}
        className={inputClass}
      />
      {errors[name] && <span id={`${name}-error`} role="alert" className="text-caption text-[color:var(--color-alert-red)] mt-1 block">{errors[name]}</span>}
    </label>
  );

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="text-caption text-ink-muted-60">Step {step + 1} of {stepFields.length}</div>

      {step === 0 && (
        <div className="space-y-4">
          <Field name="groupSize" label={locale === 'th' ? 'ขนาดกลุ่ม' : 'Group size'} type="number" />
          <Field name="ages" label={locale === 'th' ? 'อายุ / ชั้นเรียน' : 'Ages / grades'} />
          <Field name="departureMonth" label={locale === 'th' ? 'เดือนเดินทาง' : 'Departure month'} />
          <Field name="duration" label={locale === 'th' ? 'ระยะเวลา (วัน)' : 'Trip length (days)'} type="number" />
          <Field name="schoolName" label={locale === 'th' ? 'โรงเรียน / องค์กร' : 'School / organization'} />
          <Field name="role" label={locale === 'th' ? 'ตำแหน่ง' : 'Your role'} />
          <Field name="email" label="Email" type="email" />
          <Field name="phone" label={locale === 'th' ? 'โทรศัพท์' : 'Phone'} type="tel" />
          <Field name="country" label={locale === 'th' ? 'ประเทศ' : 'Country'} />
        </div>
      )}

      {step === 1 && (
        <div>
          <span className="text-caption-strong text-ink">{locale === 'th' ? 'วิชาที่สนใจ' : 'Subjects of interest'} *</span>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {categoryOptions.map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-body text-ink">
                <input
                  type="checkbox"
                  checked={data.subjects?.includes(c.value) ?? false}
                  onChange={(e) => {
                    const next = new Set(data.subjects ?? []);
                    if (e.target.checked) next.add(c.value);
                    else next.delete(c.value);
                    setData((d) => ({ ...d, subjects: Array.from(next) }));
                  }}
                  className="accent-primary"
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
          {errors.subjects && <span id="subjects-error" role="alert" className="text-caption text-[color:var(--color-alert-red)] mt-1 block">{errors.subjects}</span>}
        </div>
      )}

      {step === 2 && (
        <div>
          <span className="text-caption-strong text-ink">{locale === 'th' ? 'จุดหมาย' : 'Destinations (optional)'}</span>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
            {destinationOptions.map((d) => (
              <label key={d} className="flex items-center gap-2 text-body text-ink">
                <input
                  type="checkbox"
                  checked={data.destinations?.includes(d) ?? false}
                  onChange={(e) => {
                    const next = new Set(data.destinations ?? []);
                    if (e.target.checked) next.add(d);
                    else next.delete(d);
                    setData((d2) => ({ ...d2, destinations: Array.from(next) }));
                  }}
                  className="accent-primary"
                />
                <span>{d}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-caption text-ink-muted-60">{locale === 'th' ? 'หรือเลือก "ให้เราเลือก" ด้านล่าง' : 'Or pick "you choose" below'}</p>
        </div>
      )}

      {step === 3 && (
        <div>
          <label className="block">
            <span className="text-caption-strong text-ink">{locale === 'th' ? 'หมายเหตุ' : 'Notes / questions'}</span>
            <textarea
              rows={6}
              value={data.notes ?? ''}
              onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
              className={textareaClass}
            />
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="bg-canvas-parchment p-6 rounded-lg border border-hairline">
          <h3 className="text-body-strong text-ink mb-3">{locale === 'th' ? 'ตรวจสอบข้อมูล' : 'Review'}</h3>
          <pre className="text-caption text-ink-muted-80 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      {submitError && <p role="status" aria-live="polite" className="text-caption text-[color:var(--color-alert-red)]">{submitError}</p>}

      <div className="flex justify-between gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="inline-flex items-center justify-center bg-transparent text-primary text-body px-[22px] py-[11px] rounded-pill border border-primary hover:bg-primary/5 active:scale-[0.95] transition-colors duration-150"
          >
            {locale === 'th' ? 'ก่อนหน้า' : 'Back'}
          </button>
        )}
        <div className="flex-1" />
        {step < stepFields.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover active:scale-[0.95] text-canvas text-body px-[22px] py-[11px] rounded-pill transition-colors duration-150"
          >
            {locale === 'th' ? 'ถัดไป' : 'Next'} →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover active:scale-[0.95] text-canvas text-body px-[22px] py-[11px] rounded-pill transition-colors duration-150 disabled:opacity-50"
          >
            {submitting ? (locale === 'th' ? 'กำลังส่ง...' : 'Sending...') : (locale === 'th' ? 'ส่งคำขอ' : 'Send enquiry')}
          </button>
        )}
      </div>
    </form>
  );
}