'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/layouts/Navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader2, KeyRound, Inbox, ArrowRight } from 'lucide-react';

interface EntRow {
  id: string;
  status: string;
  watermark_token: string;
  created_at: string;
  leads?: {
    code: string;
    teaser_title: string | null;
    region: string | null;
  } | null;
}
interface ReqRow {
  id: string;
  status: string;
  message: string | null;
  contact_phone: string | null;
  created_at: string;
  leads?: {
    code: string;
    teaser_title: string | null;
    region: string | null;
  } | null;
}

export default function MyLeadsPage() {
  const { locale } = useTranslation();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [tab, setTab] = useState<'leads' | 'requests'>('leads');
  const [ents, setEnts] = useState<EntRow[]>([]);
  const [reqs, setReqs] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetch('/api/my-leads').then((r) => r.json()),
        fetch('/api/my-lead-requests').then((r) => r.json()),
      ]);
      setEnts(a?.success ? a.data || [] : []);
      setReqs(b?.success ? b.data || [] : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push(`/${locale}/auth/login`);
      return;
    }
    if (authStatus === 'authenticated') load();
  }, [authStatus, load, locale, router]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">
            Мои наводки
          </h1>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab('leads')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${tab === 'leads' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
            >
              <KeyRound className="w-4 h-4" /> Открытые лиды
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${tab === 'requests' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
            >
              <Inbox className="w-4 h-4" /> Мои заявки
            </button>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-300" />
            </div>
          ) : tab === 'leads' ? (
            ents.length === 0 ? (
              <Empty text="У вас пока нет открытых лидов" locale={locale} />
            ) : (
              <div className="space-y-3">
                {ents.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
                        {e.leads?.code}
                      </div>
                      <div className="text-sm text-gray-500">
                        {e.leads?.teaser_title} · {e.leads?.region}
                      </div>
                    </div>
                    <Link
                      href={`/${locale}/leads/${e.leads?.code}/full`}
                      className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white hover:bg-gray-800"
                    >
                      Открыть пакет <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )
          ) : reqs.length === 0 ? (
            <Empty text="Вы ещё не оставляли заявок" locale={locale} />
          ) : (
            <div className="space-y-3">
              {reqs.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
                      {r.leads?.code}
                    </div>
                    <div className="text-sm text-gray-500">
                      {r.leads?.teaser_title}
                    </div>
                  </div>
                  <span className="inline-flex px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800">
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Empty({ text, locale }: { text: string; locale: string }) {
  return (
    <div className="py-20 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
      <p className="text-gray-500">{text}</p>
      <Link
        href={`/${locale}/leads`}
        className="inline-block mt-3 text-sm text-[#0A84FF] hover:underline"
      >
        Смотреть каталог наводок →
      </Link>
    </div>
  );
}
