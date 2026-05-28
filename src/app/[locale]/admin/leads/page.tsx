'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { Shield, Loader2, Eye, EyeOff, Archive, Inbox } from 'lucide-react';

type Tab = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'SOLD' | 'ARCHIVED';

interface LeadRow {
  id: string;
  code: string;
  teaser_title: string | null;
  region: string | null;
  tier: string;
  exclusivity: string;
  license_status: string | null;
  status: string;
  price_display: string | null;
  sold_count: number;
}

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'ALL', label: 'Все' },
  { key: 'DRAFT', label: 'Черновики' },
  { key: 'PUBLISHED', label: 'Опубликованные' },
  { key: 'SOLD', label: 'Проданные' },
  { key: 'ARCHIVED', label: 'В архиве' },
];

export default function AdminLeadsPage() {
  const { locale } = useTranslation();
  const [tab, setTab] = useState<Tab>('ALL');
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (status: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/leads?status=${status}`);
      if (res.status === 401 || res.status === 403) {
        setForbidden(true);
        return;
      }
      const json = await res.json();
      setRows(json.success ? json.data || [] : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-50">
              <Shield className="w-6 h-6" /> Управление лидами
            </h1>
            <Link
              href={`/${locale}/admin/lead-requests`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Inbox className="w-4 h-4" /> Заявки на доступ
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  tab === t.key
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-300" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-24 text-center text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              Нет лидов в этой категории
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 text-left text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Код</th>
                    <th className="px-4 py-3">Название</th>
                    <th className="px-4 py-3">Регион</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3">Цена</th>
                    <th className="px-4 py-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link
                          href={`/${locale}/leads/${r.code}`}
                          className="text-[#0A84FF] hover:underline"
                        >
                          {r.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{r.teaser_title || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.region || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.price_display || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {busy === r.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <>
                              {r.status !== 'PUBLISHED' && (
                                <button
                                  onClick={() => setStatus(r.id, 'PUBLISHED')}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                >
                                  <Eye className="w-3 h-3" /> Опубликовать
                                </button>
                              )}
                              {r.status === 'PUBLISHED' && (
                                <button
                                  onClick={() => setStatus(r.id, 'DRAFT')}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                  <EyeOff className="w-3 h-3" /> Снять
                                </button>
                              )}
                              {r.status !== 'ARCHIVED' && (
                                <button
                                  onClick={() => setStatus(r.id, 'ARCHIVED')}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500"
                                >
                                  <Archive className="w-3 h-3" /> Архив
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
