import Link from 'next/link';
import { LayoutGrid, List } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';
import type { CatalogView } from '@/lib/catalog/filter';

/** «Карточки / Список» (approved design 19): plain links, works without JS. */
export default function ViewToggle({
  locale,
  view,
  gridHref,
  listHref,
}: {
  locale: string;
  view: CatalogView;
  gridHref: string;
  listHref: string;
}) {
  const t = (key: string) => translate(locale, key);
  const item = (v: CatalogView, href: string, Icon: typeof List) => (
    <Link
      href={href}
      scroll={false}
      aria-current={view === v ? 'true' : undefined}
      aria-label={t(
        v === 'grid' ? 'catalogGrid.viewGrid' : 'catalogGrid.viewList'
      )}
      className={`brand-focus inline-flex min-h-11 items-center gap-2 px-3 text-sm ${
        view === v ? 'bg-brand-ink text-brand-bg' : 'text-brand-ink'
      }`}
    >
      <Icon aria-hidden className="size-4" />
      <span className="hidden sm:inline">
        {t(v === 'grid' ? 'catalogGrid.viewGrid' : 'catalogGrid.viewList')}
      </span>
    </Link>
  );
  return (
    <nav
      aria-label={t('catalogGrid.view')}
      className="inline-flex divide-x divide-brand-line border border-brand-line"
    >
      {item('grid', gridHref, LayoutGrid)}
      {item('list', listHref, List)}
    </nav>
  );
}
