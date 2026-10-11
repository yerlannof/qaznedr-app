import { fromProspectingPlot } from '@/lib/catalog/sources/prospecting';
import { getPublicPlot } from '@/lib/prospecting/plots';

it('adapts a plot into a prospecting catalogue row', () => {
  const item = fromProspectingPlot(getPublicPlot('QN-P07')!);
  expect(item).toMatchObject({
    kind: 'prospecting',
    code: 'QN-P07',
    path: '/prospecting/QN-P07',
    commodityGroup: 'metals_tpi',
    commodities: ['Au'],
    region: 'zhetysu',
    stage: 'prospecting',
    hasInfrastructure: false,
    sortOrder: 7,
    areaHa: 4.96,
    validUntil: '2029-04-05',
    status: 'open',
  });
  expect(item.district?.ru).toBe('Алакольский район');
});
