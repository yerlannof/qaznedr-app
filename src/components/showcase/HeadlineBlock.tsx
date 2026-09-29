import {
  ArrowUpToLine,
  CircleHelp,
  Equal,
  Package,
  Ruler,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { HeadlineType } from '@/lib/leads/showcase';
import { splitHeadline } from '@/lib/leads/showcase';

const ICONS: Record<HeadlineType, LucideIcon> = {
  spike: ArrowUpToLine,
  average: Equal,
  best_interval: Ruler,
  forecast: TrendingUp,
  reserve: Package,
  unknown: CircleHelp,
};

/** The main number with its type words: type small above, value large. */
export default function HeadlineBlock({
  text,
  lang,
  type,
  size = 'md',
}: {
  text: string;
  lang?: string;
  type: HeadlineType;
  size?: 'md' | 'lg';
}) {
  const Icon = ICONS[type];
  const parts = splitHeadline(text);
  return (
    <div lang={lang} className="border-t border-brand-line pt-4">
      {parts.type && (
        <p className="flex items-center gap-2 text-brand-muted">
          <Icon aria-hidden className="size-4 shrink-0" />
          <span>{parts.type}</span>
        </p>
      )}
      <p
        className={`font-serif leading-tight mt-1 ${
          size === 'lg' ? 'text-4xl lg:text-5xl' : 'text-3xl lg:text-4xl'
        }`}
      >
        {parts.value}
      </p>
    </div>
  );
}
