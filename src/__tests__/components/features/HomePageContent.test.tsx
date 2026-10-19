jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/components/home/HomeHero', () => () => null);
jest.mock('@/components/features/GeologyScene', () => () => null);
import { render, screen } from '@testing-library/react';
import HomePageContent from '@/components/features/HomePageContent';
import { translate } from '@/lib/i18n/translations';
import type { LeadTeaser } from '@/lib/leads/types';

const areasTitle = translate('ru', 'homeV2.showcaseTitle');

it('shows artisanal plots as cards even while no find is published', () => {
  render(
    <HomePageContent
      locale="ru"
      snapshot={{ stats: { total: 0, regions: 0 }, leads: [], coal: 0 }}
    />
  );
  expect(screen.getByText(areasTitle)).toBeInTheDocument();
  expect(
    document.querySelector('a[href="/ru/prospecting/QN-P01"]')
  ).toBeInTheDocument();
  expect(
    document.querySelector('a[href="/ru/offers/QN-A01"]')
  ).toBeInTheDocument();
  expect(
    screen.getAllByText(translate('ru', 'catalogGrid.unverified')).length
  ).toBeGreaterThan(0);
});

it('keeps the areas section with published teasers', () => {
  const lead = {
    code: 'QN-99',
    mineral: 'Au',
    region: 'Карагандинская',
    type: 'bedrock',
    last_verified: '2026-09-28',
  } as unknown as LeadTeaser;
  render(
    <HomePageContent
      locale="ru"
      snapshot={{ stats: { total: 1, regions: 1 }, leads: [lead], coal: 0 }}
    />
  );
  expect(screen.getByText(areasTitle)).toBeInTheDocument();
});

it('renders a featured showcase teaser with its number type and one caveat', () => {
  const { fakeShowcase } = jest.requireActual('../../mocks/showcase-fixture');
  const lead = {
    code: 'QN-99',
    mineral: 'Au+Cu',
    region: 'Карагандинская',
    type: 'bedrock',
    last_verified: '2026-09-28',
    showcase: {
      ...fakeShowcase,
      headline: { ru: 'Среднее содержание: золото 1,0 г/т' },
      headline_type: 'average',
      featured: { rank: 1, fact: { ru: 'Одна оговорка дословно' } },
    },
  } as unknown as LeadTeaser;
  render(
    <HomePageContent
      locale="ru"
      snapshot={{ stats: { total: 1, regions: 1 }, leads: [lead], coal: 0 }}
    />
  );
  expect(screen.getByText('Среднее содержание:')).toBeInTheDocument();
  expect(screen.getByText('золото 1,0 г/т')).toBeInTheDocument();
  expect(screen.getByText('Одна оговорка дословно')).toBeInTheDocument();
  expect(screen.queryByText(fakeShowcase.facts.ru[0])).not.toBeInTheDocument();
  expect(
    screen.getByText(translate('ru', 'showcase.disclaimer'))
  ).toBeInTheDocument();
  expect(
    document.querySelector('a[href="/ru/leads/QN-99"]')
  ).toBeInTheDocument();
});

it.each(['ru', 'kz', 'en', 'zh'])(
  'shows the team over a labelled illustration and keeps the about link (%s)',
  (locale) => {
    const { container } = render(
      <HomePageContent
        locale={locale as 'ru' | 'kz' | 'en' | 'zh'}
        snapshot={{ stats: { total: 0, regions: 0 }, leads: [], coal: 0 }}
      />
    );
    expect(
      screen.getByRole('heading', {
        // zh keeps names unbroken in spans; compare without whitespace.
        name: (name) =>
          name.replace(/\s/g, '') ===
          translate(locale, 'holdingCompany.team').replace(/\s/g, ''),
      })
    ).toBeInTheDocument();
    expect(
      container.querySelector('img[src*="scene-geologists"]')
    ).toHaveAttribute('alt', '');
    expect(
      screen.getAllByText(translate(locale, 'homeV2.illustration')).length
    ).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole('link', { name: translate(locale, 'navigation.about') })
        .some((a) => a.getAttribute('href') === `/${locale}/about`)
    ).toBe(true);
  }
);

it('links the coal tile to the coal filter with the published count', () => {
  render(
    <HomePageContent
      locale="ru"
      snapshot={{ stats: { total: 0, regions: 0 }, leads: [], coal: 9 }}
    />
  );
  const tile = document.querySelector(
    'a[href="/ru/leads?commodity=coal"][class*="min-h-"]'
  );
  expect(tile).toHaveTextContent('В каталоге: 9');
});

it('links all three homepage guides to their existing Kazakh versions', () => {
  render(
    <HomePageContent
      locale="kz"
      snapshot={{ stats: { total: 0, regions: 0 }, leads: [], coal: 0 }}
    />
  );
  for (const slug of [
    'foreign-investor-subsoil-rights-kazakhstan',
    'solid-minerals-exploration-licence-kazakhstan',
    'reserve-classification-gkz-kazrc-jorc-gbt17766',
  ]) {
    expect(
      document.querySelector(`a[href="/kz/insights/${slug}"]`)
    ).toBeInTheDocument();
  }
});

it('shows at most four cards on the home page', () => {
  const { container } = render(
    <HomePageContent
      locale="ru"
      snapshot={{ stats: { total: 0, regions: 0 }, leads: [], coal: 0 }}
    />
  );
  const section = container.querySelector('[aria-labelledby="home-areas"]')!;
  expect(section.querySelectorAll('article').length).toBeLessThanOrEqual(4);
});
