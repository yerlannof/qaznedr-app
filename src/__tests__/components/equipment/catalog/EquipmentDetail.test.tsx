import { fireEvent, render, screen } from '@testing-library/react';
import EquipmentDetail from '@/components/equipment/catalog/EquipmentDetail';
import { safeTrack } from '@/lib/analytics/events';
import type { PublicEquipmentListing } from '@/lib/equipment-listings/catalog-repository';

jest.mock('@/lib/analytics/events', () => ({ safeTrack: jest.fn() }));

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

const contacts = {
  whatsappNumber: '77000000000',
  wechatId: null,
  wechatQrSrc: null,
  email: null,
};

let fetchMock: jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.fn().mockResolvedValue({ ok: true });
  global.fetch = fetchMock as unknown as typeof fetch;
});

const click = (link: HTMLElement) => {
  link.addEventListener('click', (event) => event.preventDefault());
  fireEvent.click(link);
};

it('counts the owner WhatsApp link in analytics and in the listing stats, but not the call link', () => {
  render(
    <EquipmentDetail
      listing={listing({ phone: '+7 700 000 00 00' })}
      locale="ru"
      images={[]}
      marks={[]}
      contacts={contacts as never}
    />
  );
  const links = screen.getAllByRole('link');
  const call = links.find((a) => a.getAttribute('href')?.startsWith('tel:'))!;
  click(call);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(safeTrack).not.toHaveBeenCalled();

  const owner = links.find((a) =>
    a.getAttribute('href')?.startsWith('https://wa.me/77000000000?')
  )!;
  click(owner);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(safeTrack).toHaveBeenCalledWith(
    'click_whatsapp',
    expect.objectContaining({ locale: 'ru', place: 'equipment_owner' })
  );
});

it('counts the team WhatsApp link and the report link separately', () => {
  render(
    <EquipmentDetail
      listing={listing({ phone: null } as never)}
      locale="kz"
      images={[]}
      marks={[]}
      contacts={contacts as never}
    />
  );
  const wa = screen
    .getAllByRole('link')
    .filter((a) => a.getAttribute('href')?.startsWith('https://wa.me/'));
  expect(wa).toHaveLength(2);
  wa.forEach(click);
  expect(safeTrack).toHaveBeenCalledWith(
    'click_whatsapp',
    expect.objectContaining({ locale: 'kz', place: 'equipment_team' })
  );
  expect(safeTrack).toHaveBeenCalledWith(
    'click_whatsapp',
    expect.objectContaining({ locale: 'kz', place: 'equipment_report' })
  );
  // Only the contact link (inside the beacon) reaches the listing stats.
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
