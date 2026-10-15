'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, ShieldCheck, X } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import CompanyModeration from '@/components/equipment/CompanyModeration';
import { useTranslation } from '@/hooks/useTranslation';
import { translate } from '@/lib/i18n/translations';
import { regionLabel } from '@/lib/data/filter-config';
import type { EquipmentListing } from '@/lib/equipment-listings/domain';

// The moderation console is internal and Russian-only, like the other admin pages.
type Tab = 'PENDING' | 'ACTIVE' | 'COMPANIES';
type Mark = 'PHONE_CONFIRMED' | 'DOCUMENTS_REVIEWED' | 'VERIFIED_QAZNEDR';
type Precheck = {
  verdict: 'OK' | 'REVIEW' | 'REJECT_SUGGESTED';
  flags: { code: string; note: string }[];
  summary: string | null;
  model: string;
};
type Payload = {
  data: EquipmentListing[];
  trustMarks: Record<string, { mark: Mark; setAt: string }[]>;
  prechecks: Record<string, Precheck>;
};

const MARKS: { mark: Mark; label: string }[] = [
  { mark: 'PHONE_CONFIRMED', label: 'Телефон подтверждён' },
  { mark: 'DOCUMENTS_REVIEWED', label: 'Документы просмотрены' },
  { mark: 'VERIFIED_QAZNEDR', label: 'Проверено QAZNEDR (осмотр/видеозвонок)' },
];
const VERDICTS: Record<Precheck['verdict'], string> = {
  OK: 'Замечаний нет',
  REVIEW: 'Посмотрите внимательно',
  REJECT_SUGGESTED: 'Предлагается отклонить',
};
const REASONS = [
  'Контакты или ссылки в тексте объявления — укажите их только в полях контакта.',
  'Объявление не относится к геологической технике или услугам.',
  'Выбран не тот раздел или тип техники.',
  'Недостаточно описания: что именно предлагается, где и на каких условиях.',
  'Фото не соответствуют объявлению или плохо видно технику.',
  'Параметры выглядят недостоверно — уточните и отправьте снова.',
];
const HIDDEN = new Set(['schemaVersion', 'capabilities', 'title']);

const label = (key: string) => {
  const name = key === 'title' ? 'listingTitle' : key;
  const text = translate('ru', `equipmentIntake.${name}`);
  return text.startsWith('equipmentIntake.') ? key : text;
};
const code = (value: string) => {
  const text = translate('ru', `equipmentIntake.codes.${value}`);
  return text.startsWith('equipmentIntake.') ? value : text;
};
function show(key: string, value: unknown): string {
  if (Array.isArray(value))
    return value
      .map((item) =>
        key === 'serviceArea' && item !== 'ALL_KZ'
          ? regionLabel(String(item), 'ru')
          : code(String(item))
      )
      .join(', ');
  if (key === 'region') return regionLabel(String(value), 'ru');
  if (['offerType', 'category', 'contactVisibility'].includes(key))
    return label(String(value));
  return code(String(value));
}

function Photos({ listing }: { listing: EquipmentListing }) {
  const [ids, setIds] = useState<string[] | null>(null);
  useEffect(() => {
    fetch(
      `/api/admin/equipment-listings/${listing.id}/images?expectedRevision=${listing.revision}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((json) =>
        setIds(
          (json?.data?.images ?? []).map((image: { id: string }) => image.id)
        )
      )
      .catch(() => setIds([]));
  }, [listing.id, listing.revision]);
  if (ids === null) return <p className="text-sm text-brand-muted">Фото…</p>;
  if (!ids.length) return <p className="text-sm text-brand-muted">Без фото</p>;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ids.map((imageId) => (
        // Private, moderation-only images: next/image would cache them publicly.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={imageId}
          src={`/api/admin/equipment-listings/${listing.id}/images/${imageId}?expectedRevision=${listing.revision}`}
          alt=""
          className="aspect-square w-full rounded border border-brand-line object-cover"
        />
      ))}
    </div>
  );
}

export default function AdminEquipmentPage() {
  const { locale } = useTranslation();
  const [tab, setTab] = useState<Tab>('PENDING');
  const [payload, setPayload] = useState<Payload | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async (current: Tab) => {
    setPayload(null);
    setError(null);
    const res = await fetch(
      `/api/admin/equipment-listings?status=${current === 'ACTIVE' ? 'ACTIVE' : 'PENDING'}`
    ).catch(() => null);
    if (res && (res.status === 401 || res.status === 403)) {
      setForbidden(true);
      return;
    }
    const json = res?.ok ? await res.json() : null;
    if (!json?.success) {
      setError('Не удалось загрузить список. Обновите страницу.');
      setPayload({ data: [], trustMarks: {}, prechecks: {} });
      return;
    }
    setPayload(json);
  }, []);

  useEffect(() => {
    if (tab === 'COMPANIES') return;
    void load(tab);
  }, [load, tab]);

  const post = async (url: string, body: unknown, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 403)
        setError('Нельзя модерировать собственное объявление или нет прав.');
      else if (res.status === 409)
        setError('Объявление изменилось. Список обновлён, проверьте ещё раз.');
      else if (!res.ok) setError('Действие не выполнено. Повторите.');
      await load(tab);
    } finally {
      setBusy(null);
    }
  };

  if (forbidden)
    return (
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-32 text-center text-brand-ink">
        <Navigation />
        <ShieldCheck aria-hidden className="mx-auto mb-4 h-10 w-10" />
        <h1 className="font-serif text-3xl">Доступ запрещён</h1>
        <p className="mt-2 text-brand-muted">
          Страница доступна модераторам объявлений.
        </p>
      </main>
    );

  return (
    <main className="mx-auto max-w-5xl px-5 pb-10 pt-28 text-brand-ink">
      <Navigation />
      <Link
        href={`/${locale}/admin`}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-brand-muted"
      >
        <ArrowLeft aria-hidden size={16} /> Админка
      </Link>
      <h1 className="mt-2 font-serif text-4xl">Модерация техники и услуг</h1>
      <p className="mt-2 text-brand-muted">
        Автопроверка только подсказывает. Решение принимает модератор.
      </p>
      <div role="tablist" className="mt-6 flex flex-wrap gap-2">
        {(['PENDING', 'ACTIVE', 'COMPANIES'] as Tab[]).map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={`min-h-11 rounded border px-4 font-semibold ${tab === item ? 'border-brand-ink bg-brand-ink text-brand-bg' : 'border-brand-line'}`}
          >
            {item === 'PENDING'
              ? 'На проверке'
              : item === 'ACTIVE'
                ? 'Опубликованные'
                : 'Компании'}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {tab === 'COMPANIES' ? (
        <CompanyModeration />
      ) : !payload ? (
        <p className="mt-8 flex items-center gap-2 text-brand-muted">
          <Loader2 aria-hidden className="animate-spin" size={18} /> Загрузка…
        </p>
      ) : !payload.data.length ? (
        <p className="mt-8 text-brand-muted">
          {tab === 'PENDING'
            ? 'Новых объявлений на проверке нет.'
            : 'Опубликованных объявлений пока нет.'}
        </p>
      ) : (
        <ul className="mt-6 space-y-6">
          {payload.data.map((listing) => {
            const check = payload.prechecks[listing.id];
            const marks = new Set(
              (payload.trustMarks[listing.id] ?? []).map((row) => row.mark)
            );
            const reason = reasons[listing.id] ?? '';
            return (
              <li
                key={listing.id}
                className="space-y-4 rounded border border-brand-line bg-brand-surface p-5"
              >
                <div>
                  <p className="text-sm text-brand-muted">
                    {show('category', listing.data.category)} ·{' '}
                    {show('offerType', listing.data.offerType)}
                  </p>
                  <h2 className="font-serif text-2xl">{listing.data.title}</h2>
                </div>
                {check && (
                  <div
                    className={`rounded border p-3 text-sm ${check.verdict === 'OK' ? 'border-brand-line' : 'border-amber-600'}`}
                  >
                    <p className="font-semibold">
                      Автопроверка: {VERDICTS[check.verdict]}
                      {check.model === 'rules' ? ' (правила, без ИИ)' : ''}
                    </p>
                    {check.flags.length > 0 && (
                      <ul className="mt-1 list-disc pl-5">
                        {check.flags.map((flag) => (
                          <li key={flag.code}>{flag.note || flag.code}</li>
                        ))}
                      </ul>
                    )}
                    {check.summary && <p className="mt-1">{check.summary}</p>}
                  </div>
                )}
                <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[14rem_1fr]">
                  {Object.entries(listing.data)
                    .filter(([key]) => !HIDDEN.has(key))
                    .map(([key, value]) => (
                      <div key={key} className="contents">
                        <dt className="text-brand-muted">{label(key)}</dt>
                        <dd className="break-words">{show(key, value)}</dd>
                      </div>
                    ))}
                  {(listing.data.capabilities ?? []).map((row, index) => (
                    <div key={index} className="contents">
                      <dt className="text-brand-muted">
                        {label('capabilities')}
                      </dt>
                      <dd>
                        {[
                          code(row.method),
                          row.depth && `${row.depth} м`,
                          row.diameter && `Ø ${row.diameter} мм`,
                          row.coreSize,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </dd>
                    </div>
                  ))}
                </dl>
                <Photos listing={listing} />
                <fieldset>
                  <legend className="mb-1 text-sm font-semibold">
                    Отметки доверия (видны клиентам с датой)
                  </legend>
                  <div className="flex flex-wrap gap-x-6">
                    {MARKS.map(({ mark, label: text }) => (
                      <label
                        key={mark}
                        className="flex min-h-11 items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={marks.has(mark)}
                          disabled={busy !== null}
                          onChange={(event) =>
                            void post(
                              `/api/admin/equipment-listings/${listing.id}/trust`,
                              { mark, enabled: event.target.checked },
                              `${listing.id}:${mark}`
                            )
                          }
                        />
                        {text}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {listing.status === 'PENDING_MODERATION' && (
                  <div className="space-y-3 border-t border-brand-line pt-4">
                    <label className="block text-sm font-semibold">
                      Причина отказа (увидит автор)
                      <select
                        className="mt-1 min-h-11 w-full rounded border border-brand-line bg-brand-bg px-3"
                        value=""
                        onChange={(event) =>
                          setReasons((old) => ({
                            ...old,
                            [listing.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Готовые причины…</option>
                        {REASONS.map((text) => (
                          <option key={text} value={text}>
                            {text}
                          </option>
                        ))}
                      </select>
                      <textarea
                        className="mt-2 w-full rounded border border-brand-line bg-brand-bg px-3 py-2"
                        rows={2}
                        value={reason}
                        onChange={(event) =>
                          setReasons((old) => ({
                            ...old,
                            [listing.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() =>
                          void post(
                            `/api/admin/equipment-listings/${listing.id}/moderate`,
                            {
                              decision: 'APPROVE',
                              expectedRevision: listing.revision,
                            },
                            `${listing.id}:approve`
                          )
                        }
                        className="inline-flex min-h-12 items-center gap-2 rounded bg-brand-accent px-6 font-semibold text-brand-slate disabled:opacity-50"
                      >
                        <Check aria-hidden size={18} /> Опубликовать
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null || !reason.trim()}
                        onClick={() =>
                          void post(
                            `/api/admin/equipment-listings/${listing.id}/moderate`,
                            {
                              decision: 'REJECT',
                              expectedRevision: listing.revision,
                              reason: reason.trim(),
                            },
                            `${listing.id}:reject`
                          )
                        }
                        className="inline-flex min-h-12 items-center gap-2 rounded border border-brand-line px-6 font-semibold disabled:opacity-50"
                      >
                        <X aria-hidden size={18} /> Отклонить
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
