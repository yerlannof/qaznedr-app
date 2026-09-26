import { translate } from '@/lib/i18n/translations';

const STEPS = [1, 2, 3, 4] as const;

// "How the deal works": shared by the home page and About. It has no hooks,
// so it renders both in server pages and in the client home tree.
export default function DealSteps({ locale }: { locale: string }) {
  const t = (key: string) => translate(locale, key);
  return (
    <section className="bg-white dark:bg-[#0A0A0A] border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <h2 className="font-serif font-light text-3xl lg:text-4xl tracking-tight text-gray-900 dark:text-gray-50">
          {t('dealSteps.title')}
        </h2>
        <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((n) => (
            <li
              key={n}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-6"
            >
              <div className="font-serif text-3xl text-gold-dark dark:text-gold-light tabular-nums">
                {`0${n}`}
              </div>
              <div className="h-px w-12 bg-gold/40 my-4" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {t(`dealSteps.step${n}Title`)}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t(`dealSteps.step${n}Desc`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
