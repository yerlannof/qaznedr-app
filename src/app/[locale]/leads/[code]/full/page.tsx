import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth.config';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { Badge } from '@/components/ui/badge';
import LeadWatermark from '@/components/features/LeadWatermark';
import LeadUnlockForm from '@/components/features/LeadUnlockForm';
import { Lock, MapPin, FileText, ChevronRight } from 'lucide-react';
import { getPublishedLeadByCode } from '@/lib/leads/public-queries';
import { readPrivateForEntitled } from '@/lib/leads/private-access';

export const dynamic = 'force-dynamic';

export default async function LeadFullPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;

  // Unknown/unpublished code → 404 (no existence leak), before any auth work.
  const teaser = await getPublishedLeadByCode(code);
  if (!teaser) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(
      `/${locale}/auth/login?callbackUrl=${encodeURIComponent(`/${locale}/leads/${code}/full`)}`
    );
  }
  const userId = (session!.user as any).id as string;

  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0] || undefined;
  const ua = h.get('user-agent') || undefined;

  const result = await readPrivateForEntitled(userId, code, {
    ip,
    userAgent: ua,
    action: 'VIEW_PRIVATE',
  });

  // No active entitlement → friendly request screen (no private data in tree).
  if (!result) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(200,162,75,0.12)] flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-gold-dark dark:text-gold-light" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-900 dark:text-gray-50">
              Доступ ещё не открыт
            </h1>
            <p className="mt-2 text-gray-500">
              Полные данные по наводке{' '}
              <span className="font-mono">{teaser.code}</span> (название, точные
              координаты, первоисточник) передаются после заявки и соглашения.
            </p>
            <div className="mt-8 text-left rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-sm font-semibold mb-3">Оставить заявку</h2>
              <LeadUnlockForm code={teaser.code} locale={locale} />
            </div>
            <Link
              href={`/${locale}/leads/${teaser.code}`}
              className="inline-block mt-6 text-sm text-[#0A84FF] hover:underline"
            >
              ← Вернуться к тизеру
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const p = result.private;
  const wm = `${session!.user.email ?? userId} · ${result.watermarkToken}`;

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) =>
    value ? (
      <div className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <dt className="text-xs uppercase tracking-wider text-gray-400">
          {label}
        </dt>
        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">
          {value}
        </dd>
      </div>
    ) : null;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#0A0A0A] pt-16 lg:pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <LeadWatermark label={wm} />
          <div className="relative z-10">
            <nav
              aria-label="Breadcrumb"
              className="text-sm text-gray-400 mb-6 flex items-center gap-1.5"
            >
              <Link href={`/${locale}/leads`} className="hover:text-gray-600">
                Наводки
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href={`/${locale}/leads/${teaser.code}`}
                className="hover:text-gray-600"
              >
                {teaser.code}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-600 dark:text-gray-300">
                Полный пакет
              </span>
            </nav>

            <div className="flex items-center gap-2 mb-1">
              <Badge variant="gold">
                <Lock className="w-3 h-3 mr-1" />
                Полный доступ
              </Badge>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-50">
              {p.name || teaser.teaser_title || teaser.code}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white/70 dark:bg-[#141414]/70">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Привязка
                </h2>
                <dl>
                  <Row label="Название" value={p.name} />
                  <Row label="Варианты названия" value={p.name_variants} />
                  <Row label="Район" value={p.raion} />
                  <Row label="Населённый пункт" value={p.locality} />
                  <Row
                    label="Координаты"
                    value={
                      p.lat != null && p.lon != null
                        ? `${p.lat}, ${p.lon}${p.gps_accuracy_km ? ` (±${p.gps_accuracy_km} км)` : ''}`
                        : null
                    }
                  />
                </dl>
              </section>

              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white/70 dark:bg-[#141414]/70">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Данные и источник
                </h2>
                <dl>
                  <Row label="Грейд (полный)" value={p.grade_full} />
                  <Row label="Держатель / лицензия" value={p.holder} />
                  <Row label="Договор" value={p.contract_id} />
                  <Row label="Первоисточник" value={p.source_books} />
                  <Row label="Методика" value={p.methodology} />
                  <Row label="Как выйти на точку" value={p.extraction_notes} />
                </dl>
              </section>
            </div>

            <p className="text-[12px] text-gray-400 mt-6">
              Документ помечен водяным знаком ({result.watermarkToken}) и
              привязан к вашему аккаунту. Передача третьим лицам нарушает
              соглашение и отслеживается.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
