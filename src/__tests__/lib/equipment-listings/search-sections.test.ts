import {
  equipmentSearchRpcArgs,
  parseEquipmentSearchQuery,
} from '@/lib/equipment-listings/search';

const parse = (query: string) =>
  parseEquipmentSearchQuery(new URLSearchParams(query));

describe('catalogue filters for the new sections', () => {
  it('filters by machine type, service method, accreditation and region id', () => {
    const args = equipmentSearchRpcArgs(
      parse(
        'category=labService&serviceMethod=FIRE_ASSAY&accredited=true&region=abai'
      )
    );
    expect(args).toMatchObject({
      p_category: 'labService',
      p_service_method: 'FIRE_ASSAY',
      p_accredited: true,
      p_region: 'abai',
      p_kind: null,
    });
    expect(
      equipmentSearchRpcArgs(parse('category=excavator&kind=BULLDOZER'))
    ).toMatchObject({
      p_kind: 'BULLDOZER',
    });
  });

  it('rejects filters that do not belong to the section', () => {
    expect(() => parse('category=excavator&kind=GENERATOR')).toThrow();
    expect(() =>
      parse('category=geophysService&serviceMethod=FIRE_ASSAY')
    ).toThrow();
    expect(() => parse('category=geochemService&accredited=true')).toThrow();
    expect(() => parse('kind=BULLDOZER')).toThrow();
    expect(() => parse('region=Караганда')).toThrow();
    expect(() => parse('category=labService&priceUnit=LINE_KM')).toThrow();
    expect(parse('category=labService&priceUnit=SAMPLE').priceUnit).toBe(
      'SAMPLE'
    );
    expect(() => parse('offerType=RENT&category=geochemService')).toThrow();
  });
});
