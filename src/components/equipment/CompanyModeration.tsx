'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, EyeOff, Loader2 } from 'lucide-react';

// Internal and Russian-only, like the rest of the moderation console.
type Company = {
  ownerId: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  city: string | null;
  status: 'PENDING' | 'ACTIVE' | 'HIDDEN';
};
type View = 'PENDING' | 'ACTIVE';

export default function CompanyModeration() {
  const [view, setView] = useState<View>('PENDING');
  const [rows, setRows] = useState<Company[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (current: View) => {
    setRows(null);
    setError(null);
    const res = await fetch(
      `/api/admin/equipment-companies?status=${current}`
    ).catch(() => null);
    const json = res?.ok ? await res.json() : null;
    if (!json?.success) {
      setError('Не удалось загрузить профили. Обновите страницу.');
      setRows([]);
      return;
    }
    setRows(json.data);
  }, []);
  useEffect(() => {
    void load(view);
  }, [load, view]);

  const decide = async (company: Company, status: 'ACTIVE' | 'HIDDEN') => {
    setBusy(company.ownerId);
    const res = await fetch(
      `/api/admin/equipment-companies/${encodeURIComponent(company.ownerId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }
    ).catch(() => null);
    setBusy(null);
    if (!res?.ok) setError('Не удалось сохранить решение.');
    await load(view);
  };

  return (
    <section className="mt-6">
      <div className="flex flex-wrap gap-2">
        {(['PENDING', 'ACTIVE'] as View[]).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={view === item}
            onClick={() => setView(item)}
            className={`brand-focus inline-flex min-h-11 items-center border px-3.5 text-sm ${view === item ? 'border-brand-ink bg-brand-ink text-brand-bg' : 'border-brand-hair text-brand-muted'}`}
          >
            {item === 'PENDING' ? 'Ждут проверки' : 'Опубликованные'}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-brand-bad">
          {error}
        </p>
      )}
      {!rows ? (
        <p className="mt-6 flex items-center gap-2 text-brand-muted">
          <Loader2 aria-hidden className="animate-spin" size={18} /> Загрузка…
        </p>
      ) : !rows.length ? (
        <p className="mt-6 text-brand-muted">Профилей нет.</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {rows.map((company) => (
            <li
              key={company.ownerId}
              className="grid gap-2 bg-brand-surface p-5 md:p-6"
            >
              <h2 className="text-[22px] font-normal leading-[1.25] tracking-[-0.015em]">
                {company.name}
              </h2>
              <p className="text-sm text-brand-muted">
                {[company.city, company.website, `/${company.slug}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {company.description && (
                <p className="whitespace-pre-line">{company.description}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {company.status !== 'ACTIVE' && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void decide(company, 'ACTIVE')}
                    className="brand-button brand-focus disabled:opacity-50"
                  >
                    <Check aria-hidden size={18} /> Опубликовать
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void decide(company, 'HIDDEN')}
                  className="brand-button-secondary brand-focus disabled:opacity-50"
                >
                  <EyeOff aria-hidden size={18} /> Скрыть
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
