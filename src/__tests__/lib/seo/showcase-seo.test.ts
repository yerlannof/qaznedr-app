import { showcaseSeoText } from '@/lib/seo/showcase-seo';
import { leadJsonLd } from '@/lib/seo/lead-jsonld';
import { fakeShowcase } from '../../mocks/showcase-fixture';

it('builds title and description from the card without adding claims', () => {
  const { title, description } = showcaseSeoText(fakeShowcase, 'ru');
  expect(title).toBe('Золото, медь — участок QN-99, Карагандинская область');
  expect(description).toContain(
    'Максимум в отдельной пробе: золото до 9,9 г/т'
  );
  expect(description).toContain('не выписка');
  expect(description.length).toBeLessThanOrEqual(200);
});

it('localizes when a translation exists', () => {
  expect(showcaseSeoText(fakeShowcase, 'en').title).toBe(
    'Gold, copper — area QN-99, Karaganda Region'
  );
});

it('keeps structured data free of any coordinates', () => {
  const text = showcaseSeoText(fakeShowcase, 'ru');
  const { place } = leadJsonLd(
    {
      code: 'QN-99',
      mineral: 'Au+Cu',
      region: 'Карагандинская',
      license_status: 'FREE_SHOWCASE',
      last_verified: '2026-09-28',
    },
    'ru',
    text
  );
  expect(place.name).toBe(text.title);
  expect(place.description).toBe(text.description);
  const json = JSON.stringify(place);
  expect(json).not.toMatch(/geo|latitude|longitude|48\.5|70\.0/i);
});
