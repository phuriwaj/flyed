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

  if (status === 'done') return <p className="text-bamboo-700 text-sm">Thanks — we'll send occasional trip ideas.</p>;

  return (
    <form onSubmit={submit} className="flex gap-2 max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@school.edu"
        className="flex-1 rounded border border-teak-500/30 bg-rice-50 px-3 py-2"
      />
      <button type="submit" disabled={status === 'sending'} className="px-4 py-2 bg-bamboo-700 hover:bg-bamboo-500 text-rice-50 rounded font-medium disabled:opacity-50">
        {status === 'sending' ? '...' : 'Subscribe'}
      </button>
      {status === 'error' && <p className="text-alert-red text-sm self-center">Try again</p>}
    </form>
  );
}
