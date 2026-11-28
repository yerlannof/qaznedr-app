'use client';

import { useState } from 'react';
import { goldUi } from '@/lib/gold/ui';

// «Купить» / «Хочу эксклюзив» on a gold card → POST /api/gold/<code>/request (lead_unlock_requests).
export default function GoldRequestForm({ code, locale }: { code: string; locale: string }) {
  const t = goldUi(locale);
  const [kind, setKind] = useState<'buy' | 'exclusive'>('buy');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch(`/api/gold/${encodeURIComponent(code)}/request`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, contact_phone: phone, message }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return <p className="text-sm text-emerald-700 dark:text-emerald-400">{t.sent}</p>;
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        {(['buy', 'exclusive'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold border ${kind === k ? 'bg-[#c8962e] text-white border-[#c8962e]' : 'border-gray-300 dark:border-gray-600'}`}
          >
            {k === 'buy' ? t.buy : t.exclusive}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">{kind === 'buy' ? t.buyHint : t.exclusiveHint}</p>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t.phone}
        required
        maxLength={40}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t.message}
        maxLength={1500}
        rows={2}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="w-full rounded-lg bg-[#16202b] text-white py-2 text-sm font-semibold disabled:opacity-60"
      >
        {t.send}
      </button>
      {state === 'error' && <p className="text-sm text-red-600">{t.failed}</p>}
    </form>
  );
}
