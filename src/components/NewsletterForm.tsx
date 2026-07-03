import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? 'done' : 'error');
  };

  if (status === 'done') return <p className="text-caption text-ink-muted-80">Thanks — we'll send occasional trip ideas.</p>;

  return (
    <form onSubmit={submit} className="flex gap-2 max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@school.edu"
        aria-label="Email address"
        className="flex-1 h-11 px-5 rounded-pill bg-canvas text-body text-ink placeholder:text-ink-muted-40 border border-[rgba(0,0,0,0.08)] focus:outline-none focus:border-primary transition-colors duration-150"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover active:scale-[0.95] text-canvas text-body px-[22px] py-[11px] rounded-pill transition-colors duration-150 disabled:opacity-50"
      >
        {status === 'sending' ? '...' : 'Subscribe'}
      </button>
      {status === 'error' && <p className="text-caption text-[color:var(--color-alert-red)] self-center">Try again</p>}
    </form>
  );
}