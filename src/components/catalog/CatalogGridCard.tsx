import Link from 'next/link';
import { ShieldCheck, ShieldQuestion } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import type { Locale } from '@/lib/seo/site';

export interface GridFigure {
  label: string;
  value: string;
  lang?: string;
}

export interface GridCardProps {
  locale: Locale;
  code: string;
  href: string;
  media: React.ReactNode;
  /** ISO date the QAZNEDR team verified the object, or null. */
  verifiedOn: string | null;
  /** Replaces the verification label, e.g. «Партнёр найден». */
  statusLabel?: string;
  kindLabel: string;
  title: string;
  titleLang?: string;
  where: string;
  whereLang?: string;
  /** Commodity line; `gold` marks the swatch with the accent colour. */
  commodity: { label: string; gold: boolean; lang?: string };
  figures: GridFigure[];
  /** Short caveat lines that must travel with the figures. */
  notes?: { text: string; lang?: string }[];
  footLeft: string;
  footRight: string;
  headingLevel?: 'h2' | 'h3';
}

/** One catalogue item as a compact card (approved design 19). */
export default function CatalogGridCard(p: GridCardProps) {
  const t = (key: string) => translate(p.locale, key);
  const Heading = p.headingLevel ?? 'h2';
  const verified = Boolean(p.verifiedOn);
  return (
    <article className="group relative flex flex-col border border-brand-line bg-brand-surface transition-colors hover:border-brand-ink">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-brand-line bg-brand-bg">
        {p.media}
        <span
          title={t(
            verified ? 'catalogGrid.verifiedHint' : 'catalogGrid.unverifiedHint'
          )}
          className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold ${
            p.statusLabel
              ? 'bg-brand-ink text-brand-bg'
              : verified
                ? 'bg-brand-accent text-brand-slate'
                : 'border border-dashed border-brand-line bg-brand-surface text-brand-muted'
          }`}
        >
          {!p.statusLabel &&
            (verified ? (
              <ShieldCheck aria-hidden className="size-3.5" />
            ) : (
              <ShieldQuestion aria-hidden className="size-3.5" />
            ))}
          {p.statusLabel ??
            t(verified ? 'catalogGrid.verified' : 'catalogGrid.unverified')}
          {!p.statusLabel && (
            <span className="sr-only">
              {' '}
              {t(
                verified
                  ? 'catalogGrid.verifiedHint'
                  : 'catalogGrid.unverifiedHint'
              )}
            </span>
          )}
        </span>
        <span className="absolute right-3 top-3 bg-brand-chalk/90 px-1.5 py-0.5 text-xs font-semibold tracking-wide text-brand-slate">
          {p.code}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-4">
        <p className="text-xs text-brand-muted">{p.kindLabel}</p>
        <Heading
          lang={p.titleLang}
          className="text-lg font-semibold leading-snug"
        >
          <Link
            href={p.href}
            className="brand-focus after:absolute after:inset-0 after:content-['']"
          >
            {p.title}
          </Link>
        </Heading>
        <p lang={p.whereLang} className="text-sm text-brand-muted">
          {p.where}
        </p>
        <p lang={p.commodity.lang} className="flex items-center gap-2 text-sm">
          <span
            aria-hidden
            className={`size-4 shrink-0 rounded-full border border-brand-line ${
              p.commodity.gold ? 'bg-brand-accent' : 'bg-brand-bg'
            }`}
          />
          {p.commodity.label}
        </p>
        {p.figures.length > 0 && (
          <dl
            className={`mt-auto grid border-t border-brand-line ${
              p.figures.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {p.figures.map((f, i) => (
              <div
                key={f.label}
                lang={f.lang}
                className={`flex flex-col gap-0.5 pt-2.5 pr-2 ${
                  i ? 'border-l border-brand-line pl-3' : ''
                }`}
              >
                {f.label && (
                  <dt className="text-xs text-brand-muted">{f.label}</dt>
                )}
                <dd className="font-serif text-xl leading-tight">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {p.notes?.map((n) => (
          <p
            key={n.text}
            lang={n.lang}
            className="text-xs leading-relaxed text-brand-muted"
          >
            {n.text}
          </p>
        ))}
        <p className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-t border-brand-line pt-2.5 text-xs text-brand-muted">
          <span>{p.footLeft}</span>
          <span className="font-semibold text-brand-ink">{p.footRight}</span>
        </p>
      </div>
    </article>
  );
}
