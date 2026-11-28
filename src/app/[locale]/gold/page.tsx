import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import GoldShowcase, { type GoldRow } from '@/components/features/GoldShowcase';
import { listGoldCards, rightsFresh } from '@/lib/gold/cards';
import { goldUi, dmy } from '@/lib/gold/ui';

export const dynamic = 'force-dynamic';
// Members-only page: never indexed (the open part is for signed-in users, Erlan 19.11).
export const metadata: Metadata = {
  title: 'Gold | QAZNEDR',
  robots: { index: false, follow: false },
};

export default async function GoldPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=${encodeURIComponent(`/${locale}/gold`)}`);
  }
  const t = goldUi(locale);
  const cards = await listGoldCards();
  const date = cards.map((c) => c.rights_date).filter(Boolean).sort()[0] ?? '';
  const fresh = !!date && rightsFresh(date);
  const rows: GoldRow[] = cards.map((c) => ({
    code: c.code,
    level: c.level,
    price_usd: c.price_usd,
    label: c.label,
    label_emoji: c.label_emoji,
    region: c.region,
    type: c.type,
    main_number: c.main_number,
    square: c.square ? { lat: c.square.lat, lon: c.square.lon } : null,
    sold: c.sold,
  }));

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-50">{t.title}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-3xl">{t.lead}</p>
          <GoldShowcase
            rows={rows}
            locale={locale}
            rightsFresh={fresh}
            rightsCaption={fresh ? t.rightsAsOf(dmy(date)) : t.rightsStale(dmy(date))}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
