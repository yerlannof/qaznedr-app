import { translate } from '@/lib/i18n/translations';

const STEPS = [1, 2, 3, 4] as const;

// "How the deal works": shared by the home page and About. It has no hooks,
// so it renders both in server pages and in the client home tree.
export default function DealSteps({ locale }: { locale: string }) {
  const t = (key: string) => translate(locale, key);
  return (
    <section className="bg-brand-bg text-brand-ink border-b border-brand-line">
      <div className="brand-container py-16 lg:py-20">
        <h2 className="font-serif font-light text-3xl lg:text-4xl tracking-tight text-brand-ink">
          {t('dealSteps.title')}
        </h2>
        <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((n) => (
            <li key={n} className="border-t border-brand-line pt-5">
              <div className="font-serif text-3xl text-brand-muted tabular-nums">
                {`0${n}`}
              </div>
              <div className="h-px w-12 bg-brand-line my-4" />
              <h3 className="text-base font-semibold text-brand-ink">
                {t(`dealSteps.step${n}Title`)}
              </h3>
              <p className="mt-2 text-sm text-brand-muted leading-relaxed">
                {t(`dealSteps.step${n}Desc`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
