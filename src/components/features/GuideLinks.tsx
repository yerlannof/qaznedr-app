import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import {
  GUIDE,
  GUIDE_KEYS,
  insightHref,
  type GuideKey,
} from '@/lib/insights/registry';

/** Cards linking to guides. Hook-free, so it renders in RSC and client pages. */
export default function GuideLinks({
  locale,
  heading,
  keys = GUIDE_KEYS,
}: {
  locale: string;
  heading: string;
  keys?: readonly GuideKey[];
}) {
  return (
    <section>
      <h2 className="font-serif text-2xl lg:text-3xl font-light tracking-tight text-gray-900 dark:text-gray-50">
        {heading}
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {keys.map((key) => (
          <li key={key}>
            <Link
              href={insightHref(locale, GUIDE[key])}
              className="group block h-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-5 shadow-subtle hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="block text-base font-semibold text-gray-900 dark:text-gray-50">
                {translate(locale, `insights.links.${key}`)}
              </span>
              <span className="mt-2 block text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {translate(locale, `insights.summaries.${key}`)}
              </span>
              <ArrowRight
                className="mt-3 w-4 h-4 text-gray-400 group-hover:text-gold-dark transition-colors duration-150"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
