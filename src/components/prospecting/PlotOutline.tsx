import { toLocalMetres } from '@/lib/prospecting/coords';
import { plotGeometry, type Plot } from '@/lib/prospecting/plots';
import { translate } from '@/lib/i18n/translations';
import type { Locale } from '@/lib/seo/site';

const W = 560;
const H = 360;
const PAD = 44;
const SCALES = [20, 50, 100, 200, 500];

/** Plot outline drawn from the licence corners: north up, true proportions. */
export default function PlotOutline({
  plot,
  locale,
  compact = false,
  fill = false,
}: {
  plot: Plot;
  locale: Locale;
  compact?: boolean;
  /** Fills a card's media box (grid card), no frame or caption. */
  fill?: boolean;
}) {
  const t = (key: string, params?: Record<string, unknown>) =>
    translate(locale, key, params);
  const metres = toLocalMetres(plotGeometry(plot).points);
  const xs = metres.map(([x]) => x);
  const ys = metres.map(([, y]) => y);
  const [minX, maxX, minY, maxY] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const k = Math.min(
    (W - 2 * PAD) / (maxX - minX || 1),
    (H - 2 * PAD) / (maxY - minY || 1)
  );
  const offX = (W - (maxX - minX) * k) / 2;
  const offY = (H - (maxY - minY) * k) / 2;
  const pts = metres.map(([x, y]) => [
    offX + (x - minX) * k,
    H - offY - (y - minY) * k,
  ]);
  const scale =
    [...SCALES].reverse().find((m) => m * k <= W * 0.3) ?? SCALES[0];
  const cx = pts.reduce((s, [x]) => s + x, 0) / pts.length;
  const cy = pts.reduce((s, [, y]) => s + y, 0) / pts.length;
  const label = t('prospecting.outlineLabel', { code: plot.code });

  return (
    <figure className={fill ? 'm-0 h-full bg-brand-surface pt-10' : 'm-0'}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        className={
          fill
            ? 'block h-full w-full bg-brand-surface'
            : 'block h-auto w-full border border-brand-line bg-brand-surface'
        }
      >
        <g className="stroke-brand-line" strokeOpacity={0.35} strokeWidth={1}>
          {[60, 120, 180, 240, 300].map((y) => (
            <line key={`h${y}`} x1={0} x2={W} y1={y} y2={y} />
          ))}
          {[70, 140, 210, 280, 350, 420, 490].map((x) => (
            <line key={`v${x}`} y1={0} y2={H} x1={x} x2={x} />
          ))}
        </g>
        <polygon
          points={pts
            .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
            .join(' ')}
          className="fill-brand-accent stroke-brand-ink"
          fillOpacity={0.65}
          strokeWidth={2}
        />
        {pts.map(([x, y], i) => {
          // Number sits outside the outline, away from its centre.
          const dx = x - cx;
          const dy = y - cy;
          const len = Math.hypot(dx, dy) || 1;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={5} className="fill-brand-ink" />
              <text
                x={x + (dx / len) * 18}
                y={y + (dy / len) * 18 + 5}
                textAnchor="middle"
                className="fill-brand-ink text-[15px] font-semibold"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
        <g className="stroke-brand-ink" strokeWidth={2} fill="none">
          <path
            d={`M24 ${H - 22}h${(scale * k).toFixed(1)}M24 ${H - 28}v12M${(24 + scale * k).toFixed(1)} ${H - 28}v12`}
          />
          <path
            d={
              fill
                ? `M${W - 30} ${H - 22}V${H - 56}M${W - 38} ${H - 46}l8-10 8 10`
                : `M${W - 30} 54V20M${W - 38} 30l8-10 8 10`
            }
          />
        </g>
        <text x={24} y={H - 34} className="fill-brand-muted text-[13px]">
          {scale} {t('prospecting.metres')}
        </text>
        <text
          x={W - 30}
          y={fill ? H - 64 : 72}
          textAnchor="middle"
          className="fill-brand-muted text-[13px]"
        >
          {t('prospecting.north')}
        </text>
      </svg>
      {!compact && !fill && (
        <figcaption className="mt-2 text-sm text-brand-muted">
          {t('prospecting.outlineCaption', { scale })}
        </figcaption>
      )}
    </figure>
  );
}
