import { Lock } from 'lucide-react';

// Visual placeholders for what is hidden until access is granted.
// IMPORTANT: renders NO real private data — just labels of what the buyer unlocks.
const LOCKED_ITEMS = [
  'Точное название участка',
  'Район и ближайший населённый пункт',
  'Точные координаты (GPS)',
  'Первоисточник (автор, год, инв. №)',
  'Методика выхода на точку',
];

export default function LeadLockedSection() {
  return (
    <div className="rounded-xl border border-gold/30 bg-[rgba(200,162,75,0.05)] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-gold-dark dark:text-gold-light" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Что откроется после доступа
        </h3>
      </div>
      <ul className="space-y-2">
        {LOCKED_ITEMS.map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm">
            <span className="text-gray-700 dark:text-gray-300">{item}:</span>
            <span
              aria-hidden
              className="flex-1 h-4 rounded bg-gray-200 dark:bg-gray-700 select-none"
            />
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-gray-500 mt-3">
        Этого достаточно опытному старателю, чтобы выйти на точку. Поэтому
        закрыто до соглашения и оплаты.
      </p>
    </div>
  );
}
