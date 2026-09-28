'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft, Inbox, Loader2, Shield } from 'lucide-react';
import { INQUIRY_STATUSES, type InquiryStatus } from '@/lib/inquiries/schema';
import { isPublicPath } from '@/lib/analytics/attribution';

type Tab = InquiryStatus | 'ALL';

interface InquiryRow {
  id: string;
  lead_code: string | null;
  name: string;
  company: string | null;
  country: string | null;
  channel: string;
  contact: string;
  message: string | null;
  locale: string;
  source_path: string | null;
  utm?: unknown;
  status: InquiryStatus;
  created_at: string;
}

const STATUS_LABELS: Record<Tab, string> = {
  NEW: 'Новые',
  CONTACTED: 'В работе',
  MEETING: 'Встреча',
  DEAL: 'Сделка',
  REJECTED: 'Отклонённые',
  ALL: 'Все',
};

const TABS: Tab[] = [...INQUIRY_STATUSES, 'ALL'];
const UTM_LABELS = {
  source: 'Источник UTM',
  medium: 'Канал UTM',
  campaign: 'Кампания UTM',
  term: 'Термин UTM',
  content: 'Вариант UTM',
} as const;

function attributionFields(value: unknown): Array<[string, string]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const utm = value as Record<string, unknown>;
  const fields: Array<[string, string]> = [];
  for (const [key, label] of Object.entries(UTM_LABELS)) {
    const raw = utm[key];
    if (typeof raw === 'string' && raw.trim() && raw.length <= 200)
      fields.push([label, raw]);
  }
  const landing = utm.landing_path;
  if (
    typeof landing === 'string' &&
    landing.length <= 300 &&
    /^\/(?:ru|kz|en|zh)(?:\/[A-Za-z0-9/-]*)?$/.test(landing) &&
    isPublicPath(landing)
  )
    fields.push(['Первый вход', landing]);
  const host = utm.referrer_host;
  if (
    typeof host === 'string' &&
    host.length <= 253 &&
    /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(host)
  )
    fields.push(['Реферер', host]);
  return fields;
}

export default function AdminInquiriesPage() {
  const { locale } = useTranslation();
  const [tab, setTab] = useState<Tab>('NEW');
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (status: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries?status=${status}`);
      if (res.status === 401 || res.status === 403) {
        setForbidden(true);
        return;
      }
      const json = await res.json();
      setRows(json.success ? json.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const setStatus = async (id: string, status: InquiryStatus) => {
    setBusy(id);
    try {
      await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      await load(tab);
    } finally {
      setBusy(null);
    }
  };

  if (forbidden) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0A0A0A] pt-16">
          <div className="text-center">
            <Shield className="w-10 h-10 mx-auto text-gray-300" />
            <p className="mt-3 text-gray-500">
              Доступ только для администраторов
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Админка
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-50 mb-6">
            <Inbox className="w-6 h-6" /> Входящие заявки
          </h1>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Последние 200 заявок выбранного статуса; не отчёт за всё время.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  tab === key
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {STATUS_LABELS[key]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-300" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-24 text-center text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              Заявок нет
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                >
                  <div className="min-w-0 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {r.name}
                      </span>
                      {r.company && (
                        <span className="text-gray-500">· {r.company}</span>
                      )}
                      {r.country && (
                        <span className="text-gray-500">· {r.country}</span>
                      )}
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] bg-gray-100 dark:bg-gray-800 uppercase">
                        {r.locale}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-gray-700 dark:text-gray-300">
                      {r.channel}: {r.contact}
                    </p>
                    {r.lead_code && (
                      <Link
                        href={`/${locale}/leads/${r.lead_code}`}
                        className="mt-1 inline-block font-mono text-[#0060DF] hover:underline"
                      >
                        {r.lead_code}
                      </Link>
                    )}
                    {r.message && (
                      <p className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        {r.message}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-gray-400">
                      {new Date(r.created_at).toLocaleString('ru-RU')}
                    </p>
                    {r.source_path && (
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        Страница формы: {r.source_path}
                      </p>
                    )}
                    {attributionFields(r.utm).map(([label, value]) => (
                      <p
                        key={label}
                        className="mt-1 break-all text-[11px] text-gray-500 dark:text-gray-400"
                      >
                        {label}: {value}
                      </p>
                    ))}
                  </div>
                  <div className="shrink-0">
                    {busy === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <select
                        aria-label="Статус заявки"
                        value={r.status}
                        onChange={(e) =>
                          setStatus(r.id, e.target.value as InquiryStatus)
                        }
                        className="min-h-[36px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] px-2 text-sm"
                      >
                        {INQUIRY_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
