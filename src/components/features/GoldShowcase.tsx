'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { goldUi, usd } from '@/lib/gold/ui';

// Gold showcase list + map of ~100 km squares (APPSALE gold_v1). Rows carry the open part only;
// a square is the 1° × 1.4° grid cell of the card, never the object point.

export interface GoldRow {
  code: string;
  level: number;
  price_usd: number;
  label: string;
  label_emoji: string;
  region: string;
  type: string;
  main_number: string;
  square: { lat: number; lon: number } | null;
  sold: number;
}

const HALF_LAT = 0.5;
const HALF_LON = 0.7;
const sqKey = (s: { lat: number; lon: number }) => `${s.lat.toFixed(2)},${s.lon.toFixed(2)}`;

export default function GoldShowcase({
  rows,
  locale,
  rightsCaption,
  rightsFresh,
}: {
  rows: GoldRow[];
  locale: string;
  rightsCaption: string;
  rightsFresh: boolean;
}) {
  const t = goldUi(locale);
  const [level, setLevel] = useState<number | null>(null);
  const [square, setSquare] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const squares = useMemo(() => {
    const m = new Map<string, { lat: number; lon: number; n: number }>();
    for (const r of rows) {
      if (!r.square) continue;
      const k = sqKey(r.square);
      const cur = m.get(k) ?? { lat: r.square.lat, lon: r.square.lon, n: 0 };
      cur.n += 1;
      m.set(k, cur);
    }
    return m;
  }, [rows]);

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      bounds: [
        [46.4, 40.5],
        [87.4, 55.5],
      ],
      fitBoundsOptions: { padding: 10 },
    });
    map.current = m;
    m.on('load', () => {
      const features = [...squares.entries()].map(([k, s]) => ({
        type: 'Feature' as const,
        properties: { k, n: s.n },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [s.lon - HALF_LON, s.lat - HALF_LAT],
              [s.lon + HALF_LON, s.lat - HALF_LAT],
              [s.lon + HALF_LON, s.lat + HALF_LAT],
              [s.lon - HALF_LON, s.lat + HALF_LAT],
              [s.lon - HALF_LON, s.lat - HALF_LAT],
            ],
          ],
        },
      }));
      m.addSource('sq', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });
      m.addLayer({
        id: 'sq-fill',
        type: 'fill',
        source: 'sq',
        paint: { 'fill-color': '#c8962e', 'fill-opacity': 0.28 },
      });
      m.addLayer({
        id: 'sq-line',
        type: 'line',
        source: 'sq',
        paint: { 'line-color': '#8a6414', 'line-width': 1 },
      });
      m.on('click', 'sq-fill', (e) => {
        const k = e.features?.[0]?.properties?.k as string | undefined;
        if (k) setSquare(k);
      });
      m.on('mouseenter', 'sq-fill', () => (m.getCanvas().style.cursor = 'pointer'));
      m.on('mouseleave', 'sq-fill', () => (m.getCanvas().style.cursor = ''));
      // the count sits on an HTML marker: the raster style has no glyphs for text labels
      for (const [k, s] of squares) {
        const el = document.createElement('button');
        el.type = 'button';
        el.textContent = String(s.n);
        el.setAttribute('aria-label', t.cards(s.n));
        el.className =
          'rounded-full bg-[#16202b] text-white text-xs font-semibold min-w-[22px] h-[22px] px-1.5 shadow';
        el.addEventListener('click', () => setSquare(k));
        new maplibregl.Marker({ element: el }).setLngLat([s.lon, s.lat]).addTo(m);
      }
    });
    return () => {
      m.remove();
      map.current = null;
    };
  }, [squares, t]);

  const shown = rows.filter(
    (r) =>
      (level === null || r.level === level) &&
      (square === null || (r.square && sqKey(r.square) === square))
  );
  const levels = [...new Set(rows.map((r) => r.level))].sort((a, b) => b - a);

  return (
    <div>
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t.mapTitle}</h2>
        <div ref={box} className="mt-2 h-[380px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" />
        <p className="mt-1 text-xs text-gray-500">{t.mapNote}</p>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">{t.level}:</span>
        {[null, ...levels].map((l) => (
          <button
            key={String(l)}
            type="button"
            onClick={() => setLevel(l)}
            className={`px-2.5 py-1 rounded-full border ${level === l ? 'bg-[#16202b] text-white border-[#16202b]' : 'border-gray-300 dark:border-gray-600'}`}
          >
            {l === null ? t.all : l}
          </button>
        ))}
        {square && (
          <button type="button" onClick={() => setSquare(null)} className="ml-2 text-[#0A84FF] hover:underline">
            {t.inSquare} · {t.clear}
          </button>
        )}
        <span className="ml-auto text-gray-500">{t.cards(shown.length)}</span>
      </div>

      <p className="mt-2 text-xs text-gray-500">{rightsCaption}</p>

      <div className="mt-2 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-[#141414] text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-2">{t.code}</th>
              <th className="p-2">{t.region}</th>
              <th className="p-2">{t.type}</th>
              <th className="p-2">{t.main}</th>
              <th className="p-2">{t.rights}</th>
              <th className="p-2">{t.level}</th>
              <th className="p-2">{t.price}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.code} className="border-t border-gray-100 dark:border-gray-800 align-top">
                <td className="p-2 font-mono whitespace-nowrap">
                  <Link href={`/${locale}/gold/${r.code}`} className="text-[#0A84FF] hover:underline">
                    {r.code}
                  </Link>
                </td>
                <td className="p-2">
                  {r.region}
                  {!r.square && <div className="text-xs text-gray-400">{t.noSquare}</div>}
                </td>
                <td className="p-2">{r.type}</td>
                <td className="p-2">{r.main_number}</td>
                <td className="p-2 whitespace-nowrap">
                  {rightsFresh ? `${r.label_emoji} ${r.label}` : '—'}
                </td>
                <td className="p-2 text-center">{r.level}</td>
                <td className="p-2 whitespace-nowrap">
                  {usd(r.price_usd)}
                  <div className="text-xs text-gray-400">{t.preliminary}</div>
                  {r.sold > 0 && <div className="text-xs text-amber-700">{t.sold(r.sold)}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
