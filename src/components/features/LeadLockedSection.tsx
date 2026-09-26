import { Lock } from 'lucide-react';

// Visual placeholders for what is hidden until access is granted.
// IMPORTANT: renders NO real private data — the blurred fragments below are
// lorem-like decoys, not actual lead data. They exist only to make the locked
// vault read as "real content withheld" rather than "empty / broken".
const LOCKED_ITEMS: { label: string; redacted: string }[] = [
  { label: 'Точное название участка', redacted: 'Участок Кар…ский, блок 4' },
  {
    label: 'Район и ближайший населённый пункт',
    redacted: 'с. Ак…ль, 18 км на северо-восток',
  },
  { label: 'Точные координаты (GPS)', redacted: '48.6…° N, 67.2…° E' },
  {
    label: 'Первоисточник (автор, год, инв. №)',
    redacted: 'Отчёт ГРП, 19… г., инв. № К-…',
  },
  {
    label: 'Методика выхода на точку',
    redacted: 'От развилки … по старой колее до …',
  },
];

export default function LeadLockedSection() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gold/30 bg-[rgba(200,162,75,0.05)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Lock className="h-4 w-4 text-gold-dark dark:text-gold-light" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Что откроется после доступа
        </h3>
      </div>

      <ul className="space-y-2.5">
        {LOCKED_ITEMS.map((item) => (
          <li key={item.label} className="flex flex-col gap-0.5 text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              {item.label}
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
          Доступно после открытия
        </p>
      </div>

      <p className="mt-4 text-[12px] text-gray-500">
        Этого достаточно опытному старателю, чтобы выйти на точку. Поэтому
        закрыто до соглашения и оплаты.
      </p>
    </div>
  );
}
