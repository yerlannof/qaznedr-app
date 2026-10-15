'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2 } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';

type Company = {
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  city: string | null;
  status: 'PENDING' | 'ACTIVE' | 'HIDDEN';
};
type Form = {
  name: string;
  city: string;
  website: string;
  description: string;
};
const inputClass =
  'brand-focus mt-1 min-h-11 w-full rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-ink';

/** Cabinet card: one company page that lists all of the author's listings. */
export default function CompanyProfileEditor({
  locale,
  fetcher = fetch,
}: {
  locale: string;
  fetcher?: typeof fetch;
}) {
  const t = (key: string) => translate(locale, `equipmentCompany.${key}`);
  const [company, setCompany] = useState<Company | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Form>({
    name: '',
    city: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    fetcher('/api/equipment-company')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json?.success ? json.data : null;
        if (data && typeof data === 'object' && !Array.isArray(data))
          setCompany(data);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [fetcher]);

  const startEditing = () => {
    setForm({
      name: company?.name ?? '',
      city: company?.city ?? '',
      website: company?.website?.replace(/^https:\/\//, '') ?? '',
      description: company?.description ?? '',
    });
    setError('');
    setEditing(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetcher('/api/equipment-company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = res.ok ? await res.json() : null;
      if (json?.success) {
        setCompany(json.data);
        setEditing(false);
      } else setError(t(res.status === 400 ? 'invalid' : 'failed'));
    } catch {
      setError(t('failed'));
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return null;
  return (
    <div className="space-y-3 border border-brand-line bg-brand-surface p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Building2 aria-hidden className="size-4" />
        {t('title')}
      </h2>
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          {(['name', 'city', 'website'] as const).map((field) => (
            <label key={field} className="block text-sm font-semibold">
              {t(field)}
              {field === 'name' ? ' *' : ''}
              <input
                required={field === 'name'}
                maxLength={field === 'website' ? 200 : 160}
                inputMode={field === 'website' ? 'url' : undefined}
                placeholder={field === 'website' ? 'bur-servis.kz' : undefined}
                className={inputClass}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </label>
          ))}
          <label className="block text-sm font-semibold">
            {t('description')}
            <textarea
              rows={4}
              maxLength={3000}
              placeholder={t('descriptionHint')}
              className={inputClass}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <p className="text-sm text-brand-muted">{t('reviewNote')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="brand-button brand-focus gap-2"
            >
              {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {t('save')}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-11 px-2 underline"
            >
              {t('cancel')}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-sm font-semibold">
              {error}
            </p>
          )}
        </form>
      ) : company ? (
        <>
          <p className="font-semibold">{company.name}</p>
          <p className="text-sm text-brand-muted">
            {t(`status_${company.status}`)}
          </p>
          {company.status === 'ACTIVE' && (
            <Link
              href={`/${locale}/equipment/company/${company.slug}`}
              className="brand-focus block text-sm underline"
            >
              {t('openPage')}
            </Link>
          )}
          <button
            type="button"
            onClick={startEditing}
            className="min-h-11 text-sm font-semibold underline"
          >
            {t('edit')}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-brand-muted">{t('intro')}</p>
          <button
            type="button"
            onClick={startEditing}
            className="brand-button-secondary brand-focus w-full justify-center"
          >
            {t('create')}
          </button>
        </>
      )}
    </div>
  );
}
