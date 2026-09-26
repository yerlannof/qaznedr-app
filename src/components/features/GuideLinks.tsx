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
      <h2 className="font-serif text-2xl lg:text-3xl font-light tracking-tight text-brand-ink">
        {heading}
      </h2>
      <ul className="mt-6 grid gap-x-8 sm:grid-cols-2 border-y border-brand-line">
        {keys.map((key) => (
          <li key={key} className="border-b border-brand-line last:border-b-0">
            <Link
              href={insightHref(locale, GUIDE[key])}
              className="brand-focus group flex h-full min-h-11 items-start justify-between gap-4 py-5"
            >
              <div>
                <span className="block text-base font-semibold text-brand-ink">
                  {translate(locale, `insights.links.${key}`)}
                </span>
                <span className="mt-2 block text-sm text-brand-muted leading-relaxed">
                  {translate(locale, `insights.summaries.${key}`)}
                </span>
              </div>
              <ArrowRight
                className="mt-1 w-4 h-4 shrink-0 text-brand-muted transition-colors duration-150"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
