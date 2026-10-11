import type { Plot } from '@/lib/prospecting/plots';
import { plotPath } from '@/lib/prospecting/present';
import type { CatalogItem } from '../types';

/** A published artisanal-mining plot as a catalogue row (kind 'prospecting'). */
export function fromProspectingPlot(plot: Plot): CatalogItem {
  return {
    kind: 'prospecting',
    code: plot.code,
    path: plotPath(plot.code),
    commodityGroup: 'metals_tpi',
    commodities: ['Au'],
    region: plot.region,
    stage: 'prospecting',
    hasInfrastructure: false,
    publishedAt: plot.published_at,
    sortOrder: Number(plot.code.slice(-2)),
    areaHa: plot.area_ha,
    validUntil: plot.valid_until,
    district: plot.district,
    status: plot.status === 'matched' ? 'matched' : 'open',
  };
}
