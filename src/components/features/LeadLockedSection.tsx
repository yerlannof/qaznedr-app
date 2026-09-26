import { LockKeyhole } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';

/** Only the agreed list of materials, never private values or coordinates. */
export default function LeadLockedSection({ locale }: { locale: string }) {
  const t = (key: string) => translate(locale, key);
  return (
    <section className="border-t border-brand-line bg-brand-surface p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <LockKeyhole aria-hidden className="size-5" />
        <h2 className="font-serif text-2xl">{t('leadLocked.heading')}</h2>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
        {['itemName', 'itemArea', 'itemCoords', 'itemAssessment'].map((key) => (
          <li key={key} className="border-t border-brand-line pt-3">
            {t(`leadLocked.${key}`)}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-brand-muted leading-relaxed">
        {t('leadLocked.note')}
      </p>
    </section>
  );
}
