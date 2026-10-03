import { notFound } from 'next/navigation';
import { EquipmentIntake } from '@/components/equipment/EquipmentIntake';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { toLocale } from '@/lib/seo/site';
import { getServerTranslation } from '@/lib/i18n/translations';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const { t } = getServerTranslation(locale);
  return {
    ...buildPageMetadata({
      locale: toLocale(locale),
      path: '/equipment/new',
      title: t('equipmentIntake.title'),
      description: t('equipmentIntake.intro'),
      noindex: true,
    }),
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: Props) {
  if (
    process.env.EQUIPMENT_MARKETPLACE_ENABLED !== 'true' ||
    process.env.EQUIPMENT_INTAKE_ENABLED !== 'true'
  )
    notFound();
  const { locale } = await params;
  const googleEnabled = Boolean(
    process.env.MARKETPLACE_IDENTITY_ENABLED === 'true' &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
  );
  return <EquipmentIntake locale={locale} googleEnabled={googleEnabled} />;
}
