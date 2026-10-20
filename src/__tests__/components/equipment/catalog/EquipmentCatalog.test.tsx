import { render, screen } from '@testing-library/react';
import EquipmentCatalog, {
  type CatalogCounts,
} from '@/components/equipment/catalog/EquipmentCatalog';
import type { PublicEquipmentListing } from '@/lib/equipment-listings/catalog-repository';

const zero: CatalogCounts = {
  groups: { machinery: 0, toolsInstruments: 0, services: 0, people: 0 },
  offers: { all: 0, RENT: 0, SALE: 0, SERVICE: 0, WANTED: 0 },
  total: 0,
};
const listing = (patch: Partial<PublicEquipmentListing>) =>
  ({
    id: '11111111-1111-4111-8111-111111111111',
    offerType: 'RENT',
    category: 'drill',
    title: 'УКБ-5П',
    region: 'karagandy',
    updatedAt: '2026-10-20T10:00:00Z',
    ...patch,
  }) as PublicEquipmentListing;

it('invites the first authors while nothing is published', () => {
  render(
    <EquipmentCatalog
      locale="ru"
      filters={{ page: 1 }}
      result={{ items: [], total: 0, limit: 24 }}
      covers={{}}
      marks={{}}
      counts={zero}
      whatsappNumber="77000000000"
    />
  );
  expect(
    screen.getByRole('heading', {
      name: 'Объявлений пока нет. Ваше может стать первым',
    })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Разместить заявку «Ищу»' })
  ).toHaveAttribute('href', '/ru/equipment/new');
  // No subscription without e-mail delivery.
  expect(screen.queryByText(/Подпишитесь/)).not.toBeInTheDocument();
});

it('keeps the filters and offers a reset when a filter finds nothing', () => {
  render(
    <EquipmentCatalog
      locale="ru"
      filters={{ page: 1, region: 'abai' }}
      result={{ items: [], total: 0, limit: 24 }}
      covers={{}}
      marks={{}}
      counts={{ ...zero, total: 3 }}
    />
  );
  expect(
    screen.getByText(/По этим условиям объявлений пока нет/)
  ).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Сбросить' })[0]).toHaveAttribute(
    'href',
    '/ru/equipment'
  );
});

it('links section tiles to a group and marks requests apart from offers', () => {
  render(
    <EquipmentCatalog
      locale="ru"
      filters={{ page: 1, group: 'machinery' }}
      result={{
        items: [
          listing({}),
          listing({
            id: '22222222-2222-4222-8222-222222222222',
            offerType: 'WANTED',
            title: 'Нужна буровая',
          }),
        ],
        total: 2,
        limit: 24,
      }}
      covers={{}}
      marks={{}}
      counts={{
        ...zero,
        groups: { ...zero.groups, machinery: 2 },
        offers: { ...zero.offers, all: 2, RENT: 1, WANTED: 1 },
        total: 2,
      }}
    />
  );
  // The active tile toggles the group off.
  expect(
    screen.getByRole('link', { current: true, name: /Техника/ })
  ).toHaveAttribute('href', '/ru/equipment');
  expect(
    screen.getByRole('link', { name: /Инструмент и приборы/ })
  ).toHaveAttribute('href', '/ru/equipment?group=toolsInstruments');
  expect(screen.getByRole('link', { name: /Нужна буровая/ })).toHaveTextContent(
    'Бюджет'
  );
});
