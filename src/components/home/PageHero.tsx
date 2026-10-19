import Image from 'next/image';
import { keepWords } from '@/lib/i18n/keep-words';

/**
 * Photo header for inner pages: a generated illustration under the h1, with
 * the transparent overlay header on top (Navigation `overlay`).
 */
export default function PageHero({
  src,
  eyebrow,
  title,
  lede,
  label,
  children,
  position = 'center',
  compact = false,
  locale = '',
}: {
  src: string;
  eyebrow?: string;
  title: string;
  lede?: string;
  /** Visible «Иллюстрация» label. */
  label: string;
  children?: React.ReactNode;
  position?: string;
  /** Lower header for working pages (catalogue): filters stay near the top. */
  compact?: boolean;
  /** zh headings keep names such as 哈萨克斯坦 on one line. */
  locale?: string;
}) {
  return (
    <header
      className={`photo-band page-hero ${compact ? 'page-hero-compact' : ''}`}
    >
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: position }}
      />
      <div className="photo-band-scrim" aria-hidden="true" />
      <div className="relative z-[1] brand-container flex min-h-[inherit] flex-col justify-end pt-32 pb-12 lg:pb-16">
        {eyebrow && (
          <p className="holding-eyebrow text-brand-chalk/75">{eyebrow}</p>
        )}
        <h1 className="font-serif font-light mt-4 max-w-[20ch] text-[40px] sm:text-[52px] lg:text-[72px] leading-[1.02] tracking-[-0.03em]">
          {keepWords(title, locale)}
        </h1>
        {lede && (
          <p className="mt-6 max-w-[58ch] text-base lg:text-lg leading-relaxed text-brand-chalk/85">
            {lede}
          </p>
        )}
        {children}
      </div>
      <span className="absolute z-[1] right-5 bottom-3 text-[11px] text-brand-chalk/55">
        {label}
      </span>
    </header>
  );
}
