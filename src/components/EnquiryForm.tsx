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

  const validateStep = (): boolean => {
    const stepData: any = {};
    for (const f of stepFields[step]) stepData[f] = (data as any)[f] ?? '';
    const result = enquirySchema.partial().safeParse(stepData);
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
      if (!res.ok) throw new Error('Network error');
      setSubmitted(true);
    } catch (e) {
      setSubmitError(locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง' : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-bamboo-100 p-8 rounded-lg text-center">
        <h2 className="font-display text-2xl font-semibold text-teak-900">
          {locale === 'th' ? 'ขอบคุณ!' : 'Thanks!'}
        </h2>
        <p className="mt-2 text-teak-700">
          {locale === 'th' ? 'เราจะติดต่อกลับภายใน 1 วันทำการ' : "We'll be in touch within one business day."}
        </p>
      </div>
    );
  }

  const Field = ({ name, label, type = 'text', required = true }: { name: keyof EnquiryData; label: string; type?: string; required?: boolean }) => (
    <label className="block" htmlFor={name}>
      <span className="text-sm font-medium text-teak-700">{label}{required && ' *'}</span>
      <input
        id={name}
        type={type}
        value={(data[name] as string) ?? ''}
        onChange={(e) => setData((d) => ({ ...d, [name]: e.target.value }))}
        className="mt-1 w-full rounded border border-teak-500/30 bg-rice-50 px-3 py-2"
      />
      {errors[name] && <span className="text-sm text-alert-red">{errors[name]}</span>}
    </label>
  );

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="text-sm text-teak-500">Step {step + 1} of {stepFields.length}</div>

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
          <span className="text-sm font-medium text-teak-700">{locale === 'th' ? 'วิชาที่สนใจ' : 'Subjects of interest'} *</span>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {categoryOptions.map((c) => (
              <label key={c.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.subjects?.includes(c.value) ?? false}
                  onChange={(e) => {
                    const next = new Set(data.subjects ?? []);
                    if (e.target.checked) next.add(c.value);
                    else next.delete(c.value);
                    setData((d) => ({ ...d, subjects: Array.from(next) }));
                  }}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
          {errors.subjects && <span className="text-sm text-alert-red">{errors.subjects}</span>}
        </div>
      )}

      {step === 2 && (
        <div>
          <span className="text-sm font-medium text-teak-700">{locale === 'th' ? 'จุดหมาย' : 'Destinations (optional)'}</span>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
            {destinationOptions.map((d) => (
              <label key={d} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.destinations?.includes(d) ?? false}
                  onChange={(e) => {
                    const next = new Set(data.destinations ?? []);
                    if (e.target.checked) next.add(d);
                    else next.delete(d);
                    setData((d2) => ({ ...d2, destinations: Array.from(next) }));
                  }}
                />
                <span className="text-sm">{d}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-teak-500">{locale === 'th' ? 'หรือเลือก "ให้เราเลือก" ด้านล่าง' : 'Or pick "you choose" below'}</p>
        </div>
      )}

      {step === 3 && (
        <div>
          <label className="block">
            <span className="text-sm font-medium text-teak-700">{locale === 'th' ? 'หมายเหตุ' : 'Notes / questions'}</span>
            <textarea
              rows={6}
              value={data.notes ?? ''}
              onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
              className="mt-1 w-full rounded border border-teak-500/30 bg-rice-50 px-3 py-2"
            />
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="bg-rice-100 p-6 rounded">
          <h3 className="font-display text-xl font-semibold mb-3">{locale === 'th' ? 'ตรวจสอบข้อมูล' : 'Review'}</h3>
          <pre className="text-sm text-teak-700 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      {submitError && <p className="text-alert-red text-sm">{submitError}</p>}

      <div className="flex justify-between gap-3">
        {step > 0 && (
          <button type="button" onClick={back} className="px-4 py-2 border border-teak-500/30 rounded hover:bg-bamboo-100">
            {locale === 'th' ? 'ก่อนหน้า' : 'Back'}
          </button>
        )}
        <div className="flex-1" />
        {step < stepFields.length - 1 ? (
          <button type="button" onClick={next} className="px-6 py-2 bg-sunset-600 hover:bg-sunset-400 text-rice-50 rounded font-medium">
            {locale === 'th' ? 'ถัดไป' : 'Next'} →
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting} className="px-6 py-2 bg-bamboo-700 hover:bg-bamboo-500 text-rice-50 rounded font-medium disabled:opacity-50">
            {submitting ? (locale === 'th' ? 'กำลังส่ง...' : 'Sending...') : (locale === 'th' ? 'ส่งคำขอ' : 'Send enquiry')}
          </button>
        )}
      </div>
    </form>
  );
}
