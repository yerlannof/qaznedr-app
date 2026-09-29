import { KZ_MAP, KZ_REGION_SHAPES, projectKz } from '@/lib/geo/kz-regions';

export interface Zone {
  center_lat: number;
  center_lon: number;
  radius_km: number;
}

type Box = [number, number, number, number];

const KM_PER_DEG = 111.32;
const ASPECT = 1.6;

function circleLonLat(zone: Zone, steps: number): [number, number][] {
  const out: [number, number][] = [];
  const cosLat = Math.cos((zone.center_lat * Math.PI) / 180);
  for (let i = 0; i < steps; i += 1) {
    const a = (2 * Math.PI * i) / steps;
    out.push([
      zone.center_lon + (zone.radius_km / (KM_PER_DEG * cosLat)) * Math.sin(a),
      zone.center_lat + (zone.radius_km / KM_PER_DEG) * Math.cos(a),
    ]);
  }
  return out;
}

/** The conditional area as a closed SVG path (no centre point is emitted). */
export function zonePath(zone: Zone): string {
  const pts = circleLonLat(zone, 72).map(([lon, lat]) => projectKz(lon, lat));
  return `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`;
}

/** Region window, widened to 16:10, that always contains every whole circle. */
export function regionViewBox(regionId: string, zones: Zone[], pad = 14): Box {
  const shape = KZ_REGION_SHAPES.find((s) => s.id === regionId);
  let [x0, y0, x1, y1] = shape
    ? [...shape.bbox]
    : [0, 0, KZ_MAP.width, KZ_MAP.height];
  for (const zone of zones) {
    for (const [lon, lat] of circleLonLat(zone, 72)) {
      const [x, y] = projectKz(lon, lat);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  x0 -= pad;
  y0 -= pad;
  x1 += pad;
  y1 += pad;
  let w = x1 - x0;
  let h = y1 - y0;
  if (w / h < ASPECT) {
    const nw = h * ASPECT;
    x0 -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = w / ASPECT;
    y0 -= (nh - h) / 2;
    h = nh;
  }
  return [x0, y0, w, h];
}

function intersects(bbox: readonly number[], [x, y, w, h]: Box) {
  return bbox[0] <= x + w && bbox[2] >= x && bbox[1] <= y + h && bbox[3] >= y;
}

/**
 * Overview scheme: pre-2022 oblast outlines plus translucent circles. By the
 * showcase contract there is no centre marker, label, coordinate, tile layer
 * or any other layer that could narrow the place.
 */
export default function ZoneMap({
  zones,
  label,
  highlight,
  view = 'country',
  className = '',
}: {
  zones: Zone[];
  label: string;
  highlight?: string;
  view?: 'country' | 'region';
  className?: string;
}) {
  const box: Box =
    view === 'region' && highlight
      ? regionViewBox(highlight, zones)
      : [0, 0, KZ_MAP.width, KZ_MAP.height];
  const shapes =
    view === 'region'
      ? KZ_REGION_SHAPES.filter((s) => intersects(s.bbox, box))
      : KZ_REGION_SHAPES;
  const round = (n: number) => Math.round(n * 10) / 10;
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={box.map(round).join(' ')}
      preserveAspectRatio="xMidYMid meet"
      className={`block h-auto w-full ${className}`}
    >
      <g aria-hidden="true">
        {shapes.map((s) => (
          <path
            key={s.id}
            data-region={s.id}
            data-highlight={s.id === highlight ? 'true' : undefined}
            d={s.d}
            className={
              s.id === highlight
                ? 'fill-[color-mix(in_srgb,var(--brand-line)_22%,var(--brand-surface))] stroke-[var(--brand-line)] [stroke-width:0.8] [stroke-linejoin:round]'
                : 'fill-[var(--brand-surface)] stroke-[var(--brand-line)] [stroke-width:0.6] [stroke-linejoin:round]'
            }
          />
        ))}
      </g>
      <g aria-hidden="true">
        {zones.map((zone, i) => (
          <path
            key={i}
            data-zone=""
            d={zonePath(zone)}
            className="fill-brand-accent [fill-opacity:0.6] stroke-[var(--brand-ink)] [stroke-width:1] [stroke-dasharray:3_2]"
          />
        ))}
      </g>
    </svg>
  );
}
