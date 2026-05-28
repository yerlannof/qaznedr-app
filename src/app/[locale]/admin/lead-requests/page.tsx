'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Shield,
  Loader2,
  Phone,
  KeyRound,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react';

type Tab = 'NEW' | 'CONTACTED' | 'DEAL' | 'REJECTED' | 'ALL';

interface RequestRow {
  id: string;
  lead_id: string;
  user_id: string;
  message: string | null;
  contact_phone: string | null;
  status: string;
  created_at: string;
  leads?: { code: string; teaser_title: string | null } | null;
}

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'NEW', label: 'Новые' },
  { key: 'CONTACTED', label: 'В работе' },
  { key: 'DEAL', label: 'Сделка' },
  { key: 'REJECTED', label: 'Отклонённые' },
  { key: 'ALL', label: 'Все' },
];

export default function AdminLeadRequestsPage() {
  const { locale } = useTranslation();
  const [tab, setTab] = useState<Tab>('NEW');
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (status: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lead-requests?status=${status}`);
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

  const grant = async (r: RequestRow) => {
    setBusy(r.id);
    try {
      const res = await fetch('/api/admin/lead-entitlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: r.lead_id,
          user_id: r.user_id,
          request_id: r.id,
        }),
      });
      const json = await res.json();
      if (json.success)
        alert(`Доступ выдан. Watermark: ${json.watermark_token}`);
      await load(tab);
    } finally {
      setBusy(null);
    }
  };

  const setReqStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      await fetch('/api/admin/lead-requests', {
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
            href={`/${locale}/admin/leads`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> К лидам
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-50 mb-6">
            <Shield className="w-6 h-6" /> Заявки на доступ
          </h1>

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
              Заявок нет
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <Link
                        href={`/${locale}/leads/${r.leads?.code ?? ''}`}
                        className="font-mono text-[#0A84FF] hover:underline"
                      >
                        {r.leads?.code ?? r.lead_id.slice(0, 8)}
                      </Link>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {r.leads?.teaser_title ?? ''}
                      </span>
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] bg-gray-100 dark:bg-gray-800">
                        {r.status}
                      </span>
                    </div>
                    {r.contact_phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {r.contact_phone}
                      </p>
                    )}
                    {r.message && (
                      <p className="text-xs text-gray-500 mt-1">{r.message}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      user: {r.user_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {busy === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <button
                          onClick={() => grant(r)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-gold text-white hover:bg-gold-dark"
                        >
                          <KeyRound className="w-3.5 h-3.5" /> Выдать доступ
                        </button>
                        {r.status === 'NEW' && (
                          <button
                            onClick={() => setReqStatus(r.id, 'CONTACTED')}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <Check className="w-3.5 h-3.5" /> В работу
                          </button>
                        )}
                        <button
                          onClick={() => setReqStatus(r.id, 'REJECTED')}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
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
