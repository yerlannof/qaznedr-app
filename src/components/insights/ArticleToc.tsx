'use client';

import type { MouseEvent } from 'react';
import type { ArticleTocItem } from '@/lib/insights/content';

export default function ArticleToc({
  label,
  toc,
}: {
  label: string;
  toc: ArticleTocItem[];
}) {
  if (!toc.length) return null;

  function goTo(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const heading = document.getElementById(id);
    if (!heading) return;
    event.preventDefault();
    const details = event.currentTarget.closest('details');
    if (details) details.open = false;
    window.history.pushState(null, '', `#${id}`);
    heading.focus({ preventScroll: true });
    heading.scrollIntoView?.({ block: 'start' });
  }

  function Links() {
    return (
      <ol className="space-y-2">
        {toc.map((item) => (
          <li key={item.id} className={item.level === 3 ? 'pl-4' : undefined}>
            <a
              href={`#${item.id}`}
              onClick={(event) => goTo(event, item.id)}
              className="brand-focus inline-flex min-h-11 items-center text-sm text-brand-ink underline decoration-brand-line underline-offset-4 hover:text-brand-muted"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <>
      <details
        data-testid="mobile-article-toc"
        className="mt-10 border-y border-brand-line py-3 md:hidden"
      >
        <summary className="brand-focus flex min-h-11 cursor-pointer items-center text-sm font-semibold text-brand-ink">
          {label}
        </summary>
        <nav aria-label={label} className="pb-3">
          <Links />
        </nav>
      </details>
      <nav
        aria-label={label}
        className="mt-10 hidden border-y border-brand-line py-5 md:block"
      >
        <p className="mb-3 text-sm font-semibold text-brand-ink">{label}</p>
        <Links />
      </nav>
    </>
  );
}
