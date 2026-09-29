jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/components/features/PortalWelcomeHero', () => () => null);
jest.mock('@/components/features/GeologyScene', () => () => null);
import { render, screen } from '@testing-library/react';
import HomePageContent from '@/components/features/HomePageContent';
import { translate } from '@/lib/i18n/translations';
import type { LeadTeaser } from '@/lib/leads/types';

const areasTitle = translate('ru', 'leadsHero.title');

it('omits the areas section while no area is published', () => {
  render(
    <HomePageContent
      locale="ru"
      snapshot={{ stats: { total: 0, regions: 0 }, leads: [] }}
    />
  );
  expect(screen.queryByText(areasTitle)).not.toBeInTheDocument();
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
      snapshot={{ stats: { total: 1, regions: 1 }, leads: [lead] }}
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
      snapshot={{ stats: { total: 1, regions: 1 }, leads: [lead] }}
    />
  );
  expect(screen.getByText('Среднее содержание:')).toBeInTheDocument();
  expect(screen.getByText('золото 1,0 г/т')).toBeInTheDocument();
  expect(screen.getByText('Одна оговорка дословно')).toBeInTheDocument();
  expect(screen.queryByText(fakeShowcase.facts.ru[0])).not.toBeInTheDocument();
  expect(
    screen.getByText(translate('ru', 'showcase.disclaimer'))
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /QN-99|Открыть/ })).toHaveAttribute(
    'href',
    '/ru/leads/QN-99'
  );
});

it.each(['ru', 'kz', 'en', 'zh'])(
  'uses the conditional geology cutaway with a real %s caption and keeps the about link',
  (locale) => {
    const { container } = render(
      <HomePageContent
        locale={locale as 'ru' | 'kz' | 'en' | 'zh'}
        snapshot={{ stats: { total: 0, regions: 0 }, leads: [] }}
      />
    );
    expect(
      container.querySelector('img[src*="geology-cutaway-960.webp"]')
    ).toHaveAttribute('alt', '');
    expect(
      screen.getByText(translate(locale, 'geologyScene.note'))
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: translate(locale, 'navigation.about') })
    ).toHaveAttribute('href', `/${locale}/about`);
    expect(
      container.querySelector('img[src*="archive-to-field-960.webp"]')
    ).not.toBeInTheDocument();
  }
);

it('links all three homepage guides to their existing Kazakh versions', () => {
  render(
    <HomePageContent
      locale="kz"
      snapshot={{ stats: { total: 0, regions: 0 }, leads: [] }}
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
