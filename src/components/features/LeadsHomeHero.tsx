'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LeadCard from '@/components/cards/LeadCard';
import { ShieldCheck, ArrowRight, MapPin } from 'lucide-react';
import type { LeadTeaser } from '@/lib/leads/types';

// Foregrounds leads on the homepage (portal = leads showroom). Gold-accented hero
// + a strip of featured published leads.
export default function LeadsHomeHero({ locale }: { locale: string }) {
  const [leads, setLeads] = useState<LeadTeaser[]>([]);

  useEffect(() => {
    fetch('/api/leads?limit=3')
      .then((r) => r.json())
      .then((j) => {
        if (j?.success) setLeads(j.data?.leads || []);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="pt-24 lg:pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-[rgba(200,162,75,0.08)] via-transparent to-transparent p-8 lg:p-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(200,162,75,0.15)] text-gold-dark dark:text-gold-light text-xs font-semibold mb-5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Закрытые геологические наводки · проверенные данные
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 max-w-3xl">
            Свободные участки с золотом — готовые к заявке
          </h1>
          <p className="mt-4 text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Откалиброванные наводки из государственных архивов: свободные по
            лицензии, с честными грейдами. Тизер открыт всем — точные
            координаты, название и первоисточник передаются после заявки.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/leads`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Смотреть каталог наводок
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${locale}/leads?free=1`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gold/40 text-gold-dark dark:text-gold-light text-sm font-semibold hover:bg-[rgba(200,162,75,0.06)] transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Только свободные
            </Link>
          </div>
        </div>

        {leads.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Свежие наводки
              </h2>
              <Link
                href={`/${locale}/leads`}
                className="text-sm text-[#0A84FF] hover:underline inline-flex items-center gap-1"
              >
                Все наводки <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {leads.map((lead) => (
                <LeadCard key={lead.code} lead={lead} locale={locale} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
