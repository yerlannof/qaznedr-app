import { Lock } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';

// Visual placeholders for what stays closed until an NDA. Renders NO real
// lead data: the blurred fragments are language-neutral decoys that make the
// block read as "content withheld" rather than "empty".
const LOCKED_ITEMS: { key: string; redacted: string }[] = [
  { key: 'leadLocked.itemName', redacted: 'Kar•••••, 4' },
  { key: 'leadLocked.itemArea', redacted: '••• 18 km NE' },
  { key: 'leadLocked.itemCoords', redacted: '48.6…° N, 67.2…° E' },
  { key: 'leadLocked.itemAssessment', redacted: 'Au … g/t · … m' },
];

export default function LeadLockedSection({ locale }: { locale: string }) {
  const t = (key: string) => translate(locale, key);
  return (
    <div className="relative overflow-hidden rounded-xl border border-gold/30 bg-[rgba(200,162,75,0.05)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Lock className="h-4 w-4 text-gold-dark dark:text-gold-light" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('leadLocked.heading')}
        </h3>
      </div>

      <ul className="space-y-2.5">
        {LOCKED_ITEMS.map((item) => (
          <li key={item.key} className="flex flex-col gap-0.5 text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              {t(item.key)}
            </span>
            <span
              aria-hidden
              className="select-none rounded bg-[rgba(200,162,75,0.08)] px-1.5 py-0.5 text-[13px] text-gray-500 blur-sm dark:text-gray-400"
            >
              {item.redacted}
            </span>
          </li>
        ))}
      </ul>

      {/* Lock medallion motif */}
      <div className="mt-5 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-[rgba(200,162,75,0.1)]">
          <Lock className="h-5 w-5 text-gold-dark dark:text-gold-light" />
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-gold-light">
          {t('leadLocked.badge')}
        </p>
      </div>

      <p className="mt-4 text-[12px] text-gray-500">{t('leadLocked.note')}</p>
    </div>
  );
}
