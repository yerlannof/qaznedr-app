import { leadJsonLd } from '@/lib/seo/lead-jsonld';

const lead = {
  code: 'AU-4',
  mineral: 'Au',
  region: 'Жамбылская',
  license_status: 'FREE_CONFIRMED',
  last_verified: null,
};

describe('lead JSON-LD', () => {
  it('describes a place, never a product for sale', () => {
    const { place } = leadJsonLd(lead, 'ru');
    const json = JSON.stringify(place);
    expect(place['@type']).toBe('Place');
    expect(json).not.toMatch(/Offer|InStock|SoldOut|Product|priceCurrency/);
  });

  it('reuses the dated SEO description', () => {
    expect(leadJsonLd(lead, 'ru').place.description).toContain(
      'по нашей проверке на 05.2026'
    );
  });

  it('names the breadcrumb in the page language', () => {
    const names = (loc: 'ru' | 'en') =>
      leadJsonLd(lead, loc).breadcrumb.itemListElement.map((i) => i.name);
    expect(names('ru')[1]).toBe('Участки');
    expect(names('en')[1]).toBe('Areas');
    expect(leadJsonLd(lead, 'en').breadcrumb.itemListElement[2].item).toBe(
      'https://qaznedr.kz/en/leads/AU-4'
    );
  });
});
