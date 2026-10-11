import { z } from 'zod';
import raw from './plots.v1.json';
import {
  centroid,
  polygonAreaHa,
  toPoints,
  type Corner,
  type Point,
} from './coords';

// Prospecting licences (лицензии на старательство) whose holders look for
// crews; QAZNEDR introduces the crew to the holder. Licence numbers and
// corner coordinates are public by the owner's decision (2026-10-11); holder
// names never enter this file. The right itself is not sold or transferred
// (Subsoil Code art. 263(4)).

export const PLOT_CODE = /^QN-P\d{2}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Outline must reproduce the licence area; PL licences run ~4 % low. */
const AREA_TOLERANCE = 0.1;

const localized = z.object({
  ru: z.string().min(1),
  kz: z.string().min(1),
  en: z.string().min(1),
  zh: z.string().min(1),
});

const corner = z.tuple([
  z.number().min(40).max(56),
  z.number().int().min(0).max(59),
  z.number().min(0).lt(60),
  z.number().min(46).max(88),
  z.number().int().min(0).max(59),
  z.number().min(0).lt(60),
]);

const plotSchema = z.object({
  code: z.string().regex(PLOT_CODE),
  license_number: z.string().min(1),
  issued_at: z.string().regex(ISO_DATE),
  valid_until: z.string().regex(ISO_DATE),
  region: z.enum(['zhetysu', 'zhambyl', 'east-kz']),
  district: localized,
  locality: localized.nullable(),
  plot_name: localized.nullable(),
  area_ha: z.number().positive().max(5),
  mineral: z.literal('placer_gold'),
  corners_dms: z.array(corner),
  status: z.enum(['open', 'matched', 'hidden']),
  holder_confirmed_at: z.string().regex(ISO_DATE).nullable(),
  corrected_corners: z.array(z.number().int().min(1)),
  hidden_reason: z.string().nullable().optional(),
});

const fileSchema = z.object({
  contract: z.literal('qaznedr-prospecting-v1'),
  plots: z.array(plotSchema),
});

export type Plot = z.infer<typeof plotSchema>;
export type PlotRegion = Plot['region'];

export function parsePlotsFile(data: unknown): Plot[] {
  return fileSchema.parse(data).plots;
}

export function plotGeometry(plot: Plot): {
  points: Point[];
  center: Point;
  areaHa: number;
} {
  const points = toPoints(plot.corners_dms as Corner[]);
  if (points.length < 3) {
    return { points, center: { lat: NaN, lon: NaN }, areaHa: 0 };
  }
  return { points, center: centroid(points), areaHa: polygonAreaHa(points) };
}

/** Fail closed: only confirmed plots with an outline that matches the licence. */
export function isPublishable(plot: Plot): boolean {
  if (plot.status === 'hidden' || !plot.holder_confirmed_at) return false;
  if (plot.corners_dms.length < 3) return false;
  const { areaHa } = plotGeometry(plot);
  return Math.abs(areaHa / plot.area_ha - 1) < AREA_TOLERANCE;
}

const ALL = parsePlotsFile(raw);
const PUBLIC = ALL.filter(isPublishable);

export function listPublicPlots(): Plot[] {
  return PUBLIC;
}

export function getPublicPlot(code: string): Plot | null {
  if (!PLOT_CODE.test(code)) return null;
  return PUBLIC.find((p) => p.code === code) ?? null;
}
