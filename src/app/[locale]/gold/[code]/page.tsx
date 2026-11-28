import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import LeadWatermark from '@/components/features/LeadWatermark';
import GoldRequestForm from '@/components/features/GoldRequestForm';
import { getGoldCard, readGoldPaid, rightsFresh } from '@/lib/gold/cards';
import { renderGoldMd, dropRightsRow } from '@/lib/gold/markdown';
import { goldUi, dmy } from '@/lib/gold/ui';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Gold | QAZNEDR',
  robots: { index: false, follow: false },
};

const MD =
  'gold-md text-sm text-gray-800 dark:text-gray-200 [&_table]:w-full [&_table]:my-3 [&_td]:border [&_td]:border-gray-200 ' +
  'dark:[&_td]:border-gray-700 [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:border-gray-200 dark:[&_th]:border-gray-700 ' +
  '[&_th]:p-2 [&_th]:text-left [&_p]:my-2 [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_ul]:list-disc [&_ul]:pl-5';

export default async function GoldCardPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=${encodeURIComponent(`/${locale}/gold/${code}`)}`);
  }
  const card = await getGoldCard(code);
  if (!card) notFound();
  const userId = (session!.user as any).id as string;
  const t = goldUi(locale);
  const fresh = rightsFresh(card.rights_date);

  const h = await headers();
  const paid = await readGoldPaid(userId, card.code, {
    ip: (h.get('x-forwarded-for') || '').split(',')[0] || undefined,
    userAgent: h.get('user-agent') || undefined,
  });
  // after an exclusive deal the card leaves the showcase: only its buyers still open it
  if (card.status !== 'MEMBERS' && !paid) notFound();

  const openHtml = renderGoldMd(fresh ? card.open_md : dropRightsRow(card.open_md), card.code);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {paid && <LeadWatermark label={`${session!.user!.email ?? userId} · ${paid.watermarkToken}`} />}
          <div className="relative z-10">
            <Link href={`/${locale}/gold`} className="text-sm text-[#0A84FF] hover:underline">
              {t.back}
            </Link>
            <h1 className="mt-3 text-2xl font-bold font-mono text-gray-900 dark:text-gray-50">{card.code}</h1>
            <div className={MD} dangerouslySetInnerHTML={{ __html: openHtml }} />
            <p className="text-xs text-gray-500">
              {fresh ? t.rightsAsOf(dmy(card.rights_date)) : t.rightsStale(dmy(card.rights_date))}
              {card.sold > 0 && ` · ${t.sold(card.sold)}`}
            </p>

            {paid ? (
              <section className="mt-8 rounded-xl border border-[#c8962e] p-5">
                <h2 className="text-base font-semibold mb-2">{t.paidTitle}</h2>
                <div
                  className={MD}
                  dangerouslySetInnerHTML={{ __html: renderGoldMd(paid.paid_md, card.code, card.crops) }}
                />
              </section>
            ) : (
              <section className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t.paidLocked}</p>
                <GoldRequestForm code={card.code} locale={locale} />
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
