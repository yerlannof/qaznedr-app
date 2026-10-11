/** A licence corner: [lat°, lat′, lat″, lon°, lon′, lon″]. */
export type Corner = [number, number, number, number, number, number];

export interface Point {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_M = 6_371_008.8;
const rad = (deg: number) => (deg * Math.PI) / 180;

export function dmsToDecimal(deg: number, min: number, sec: number): number {
  return deg + min / 60 + sec / 3600;
}

export function toPoints(corners: readonly Corner[]): Point[] {
  return corners.map(([a, b, c, d, e, f]) => ({
    lat: dmsToDecimal(a, b, c),
    lon: dmsToDecimal(d, e, f),
  }));
}

export function centroid(points: readonly Point[]): Point {
  const n = points.length;
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / n,
    lon: points.reduce((s, p) => s + p.lon, 0) / n,
  };
}

/**
 * Area of a small polygon (a prospecting plot is at most 5 ha) on a local
 * equirectangular projection around its centroid. Error is far below the
 * rounding of licence areas.
 */
export function polygonAreaHa(points: readonly Point[]): number {
  const { lat: lat0 } = centroid(points);
  const k = Math.cos(rad(lat0));
  const xy = points.map((p) => [
    rad(p.lon) * EARTH_RADIUS_M * k,
    rad(p.lat) * EARTH_RADIUS_M,
  ]);
  let twice = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    twice += x1 * y2 - x2 * y1;
  }
  return Math.abs(twice) / 2 / 10_000;
}

/** Local metres east/north of the centroid, for drawing the outline. */
export function toLocalMetres(points: readonly Point[]): [number, number][] {
  const c = centroid(points);
  const k = Math.cos(rad(c.lat));
  return points.map((p) => [
    rad(p.lon - c.lon) * EARTH_RADIUS_M * k,
    rad(p.lat - c.lat) * EARTH_RADIUS_M,
  ]);
}

/** 45°41'08.8534" — seconds keep the precision printed in the licence. */
export function formatDms(deg: number, min: number, sec: number): string {
  const [whole, fraction] = String(sec).split('.');
  const s = whole.padStart(2, '0') + (fraction ? `.${fraction}` : '');
  return `${deg}°${String(min).padStart(2, '0')}'${s}"`;
}
