import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import EquipmentIntake from '@/components/equipment/EquipmentIntake';
import { EquipmentDraftClient } from '@/lib/equipment-listings/intake-client';

let mockSessionStatus = 'unauthenticated';
let mockSessionUserId: string | null = null;
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: mockSessionUserId ? { user: { id: mockSessionUserId } } : null,
    status: mockSessionStatus,
  }),
  signIn: jest.fn(),
}));
jest.mock('@/lib/equipment-listings/intake-client', () => ({
  EquipmentDraftClient: jest.fn(),
}));
let mockClient: {
  listing: null | object;
  dispose: jest.Mock;
  save: jest.Mock;
  load: jest.Mock;
  images: jest.Mock;
  recover: jest.Mock;
  submit: jest.Mock;
  upload: jest.Mock;
  remove: jest.Mock;
};

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  mockSessionStatus = 'unauthenticated';
  mockSessionUserId = null;
  mockClient = {
    listing: null,
    dispose: jest.fn(),
    save: jest.fn(),
    load: jest.fn(),
    images: jest.fn().mockResolvedValue([]),
    recover: jest.fn().mockResolvedValue([]),
    submit: jest.fn(),
    upload: jest.fn(),
    remove: jest.fn(),
  };
  (EquipmentDraftClient as jest.Mock).mockImplementation(() => mockClient);
});

it('releases abandoned UI flight locks when the same owner session refreshes', async () => {
  mockSessionStatus = 'authenticated';
  mockSessionUserId = 'owner-a';
  const id = '11111111-1111-4111-8111-111111111111';
  const listing = {
    id,
    ownerId: 'owner-a',
    status: 'DRAFT',
    revision: 1,
    data: {
      schemaVersion: 2,
      offerType: 'RENT',
      category: 'drill',
      title: 'Rig',
      region: 'almaty-region',
      city: 'Almaty',
      availability: 'Now',
    },
  };
  localStorage.setItem('qaznedr:equipment-draft:owner-a', id);
  mockClient.load.mockImplementation(async () => {
    mockClient.listing = listing;
    return listing;
  });
  mockClient.save.mockImplementation(() => new Promise(() => {}));
  const firstClient = mockClient;
  const view = render(<EquipmentIntake locale="ru" googleEnabled={true} />);
  await waitFor(() => expect(firstClient.save).toHaveBeenCalled(), {
    timeout: 1800,
  });
  mockSessionStatus = 'loading';
  view.rerender(<EquipmentIntake locale="ru" googleEnabled={true} />);
  mockClient = {
    ...firstClient,
    save: jest.fn().mockResolvedValue(listing),
    load: jest.fn().mockResolvedValue(listing),
  };
  mockSessionStatus = 'authenticated';
  view.rerender(<EquipmentIntake locale="ru" googleEnabled={true} />);
  await waitFor(() => expect(mockClient.save).toHaveBeenCalled(), {
    timeout: 1800,
  });
});

it('restores this account technical text even when no server ID exists', () => {
  mockSessionStatus = 'authenticated';
  mockSessionUserId = 'owner-a';
  sessionStorage.setItem('qaznedr:equipment-intake:owner', 'owner-a');
  sessionStorage.setItem(
    'qaznedr:equipment-intake:v2',
    JSON.stringify({
      ownerId: 'owner-a',
      value: { offerType: 'RENT', category: 'drill', title: 'Own rig' },
    })
  );
  render(<EquipmentIntake locale="ru" googleEnabled={true} />);
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  expect(screen.getByRole('textbox', { name: 'Название *' })).toHaveValue(
    'Own rig'
  );
});

it('blocks autosave when initial known-ID fetch fails', async () => {
  mockSessionStatus = 'authenticated';
  mockSessionUserId = 'owner-a';
  sessionStorage.setItem('qaznedr:equipment-intake:owner', 'owner-a');
  localStorage.setItem(
    'qaznedr:equipment-draft:owner-a',
    '11111111-1111-4111-8111-111111111111'
  );
  sessionStorage.setItem(
    'qaznedr:equipment-intake:v2',
    JSON.stringify({
      ownerId: 'owner-a',
      value: {
        offerType: 'RENT',
        category: 'drill',
        title: 'Own rig',
        region: 'almaty-region',
        city: 'Almaty',
        availability: 'Now',
      },
    })
  );
  mockClient.load.mockRejectedValue(new Error('offline'));
  render(<EquipmentIntake locale="ru" googleEnabled={true} />);
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Не удалось сохранить')
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 900));
  });
  expect(mockClient.save).not.toHaveBeenCalled();
});

it('keeps a durable uncertain marker while a create is in flight and after unmount', async () => {
  mockSessionStatus = 'authenticated';
  mockSessionUserId = 'owner-a';
  sessionStorage.setItem('qaznedr:equipment-intake:owner', 'owner-a');
  sessionStorage.setItem(
    'qaznedr:equipment-intake:v2',
    JSON.stringify({
      ownerId: 'owner-a',
      value: {
        offerType: 'RENT',
        category: 'drill',
        title: 'Own rig',
        region: 'almaty-region',
        city: 'Almaty',
        availability: 'Now',
      },
    })
  );
  mockClient.save.mockImplementation(() => new Promise(() => {}));
  const view = render(<EquipmentIntake locale="ru" googleEnabled={true} />);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 900));
  });
  expect(mockClient.save).toHaveBeenCalledTimes(1);
  expect(
    localStorage.getItem('qaznedr:equipment-intake:uncertain:owner-a')
  ).toBe('1');
  view.unmount();
  expect(
    localStorage.getItem('qaznedr:equipment-intake:uncertain:owner-a')
  ).toBe('1');
});

it('binds the acknowledged draft ID before clearing the create marker', async () => {
  mockSessionStatus = 'authenticated';
  mockSessionUserId = 'owner-a';
  sessionStorage.setItem('qaznedr:equipment-intake:owner', 'owner-a');
  sessionStorage.setItem(
    'qaznedr:equipment-intake:v2',
    JSON.stringify({
      ownerId: 'owner-a',
      value: {
        offerType: 'RENT',
        category: 'drill',
        title: 'Own rig',
        region: 'almaty-region',
        city: 'Almaty',
        availability: 'Now',
      },
    })
  );
  const id = '11111111-1111-4111-8111-111111111111';
  mockClient.save.mockImplementation(async (data) => {
    expect(
      localStorage.getItem('qaznedr:equipment-intake:uncertain:owner-a')
    ).toBe('1');
    const listing = {
      id,
      ownerId: 'owner-a',
      status: 'DRAFT',
      revision: 1,
      data,
    };
    mockClient.listing = listing;
    return listing;
  });
  render(<EquipmentIntake locale="ru" googleEnabled={true} />);
  await waitFor(
    () =>
      expect(localStorage.getItem('qaznedr:equipment-draft:owner-a')).toBe(id),
    { timeout: 1800 }
  );
  expect(
    localStorage.getItem('qaznedr:equipment-intake:uncertain:owner-a')
  ).toBeNull();
});

it('loads an active listing as read only on a new tab', async () => {
  mockSessionStatus = 'authenticated';
  mockSessionUserId = 'owner-a';
  localStorage.setItem(
    'qaznedr:equipment-draft:owner-a',
    '11111111-1111-4111-8111-111111111111'
  );
  mockClient.load.mockResolvedValue({
    id: '11111111-1111-4111-8111-111111111111',
    ownerId: 'owner-a',
    status: 'ACTIVE',
    revision: 4,
    data: {
      schemaVersion: 2,
      offerType: 'RENT',
      category: 'drill',
      title: 'Published',
    },
  });
  render(<EquipmentIntake locale="ru" googleEnabled={true} />);
  await waitFor(() =>
    expect(screen.getByText('Объявление опубликовано')).toBeInTheDocument()
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 900));
  });
  expect(mockClient.save).not.toHaveBeenCalled();
});

it('clears the previous account identity and draft on user switch', () => {
  mockSessionStatus = 'authenticated';
  mockSessionUserId = 'owner-a';
  const view = render(<EquipmentIntake locale="ru" googleEnabled={true} />);
  fireEvent.click(screen.getByRole('radio', { name: 'Буровая установка' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Продаю' }));
  expect(screen.getByRole('radio', { name: 'Продаю' })).toBeChecked();
  mockSessionUserId = 'owner-b';
  view.rerender(<EquipmentIntake locale="ru" googleEnabled={true} />);
  expect(
    screen.getByRole('radio', { name: 'Буровая установка' })
  ).not.toBeChecked();
  expect(screen.queryByRole('radio', { name: 'Продаю' })).toBeNull();
  expect(sessionStorage.getItem('qaznedr:equipment-intake:owner')).toBe(
    'owner-b'
  );
  expect(sessionStorage.getItem('qaznedr:equipment-intake:v2')).not.toContain(
    'SALE'
  );
});

it('requires a category before moving to details', () => {
  render(<EquipmentIntake locale="ru" googleEnabled={false} />);
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  expect(screen.getByText('Выберите категорию')).toBeInTheDocument();
  expect(screen.getByText('Шаг 1 из 4')).toBeInTheDocument();
});

it('preserves the technical draft through auth loading and drops contact on restore', () => {
  sessionStorage.setItem(
    'qaznedr:equipment-intake:v2',
    JSON.stringify({
      ownerId: null,
      value: {
        offerType: 'RENT',
        category: 'drill',
        title: 'Saved rig',
        phone: '+77000000000',
      },
    })
  );
  mockSessionStatus = 'loading';
  const screenView = render(
    <EquipmentIntake locale="ru" googleEnabled={false} />
  );
  expect(sessionStorage.getItem('qaznedr:equipment-intake:v2')).toContain(
    'Saved rig'
  );
  mockSessionStatus = 'unauthenticated';
  screenView.rerender(<EquipmentIntake locale="ru" googleEnabled={false} />);
  expect(
    screen.getByRole('radio', { name: 'Буровая установка' })
  ).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  expect(screen.getByRole('textbox', { name: 'Название *' })).toHaveValue(
    'Saved rig'
  );
  expect(sessionStorage.getItem('qaznedr:equipment-intake:v2')).not.toContain(
    '+77000000000'
  );
});

it('uses taxonomy codes in translated selects and previews linked capability', () => {
  render(<EquipmentIntake locale="ru" googleEnabled={false} />);
  fireEvent.click(screen.getByRole('radio', { name: 'Буровая установка' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Сдаю в аренду' }));
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Название *' }), {
    target: { value: 'NEW' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Область *' }), {
    target: { value: 'almaty-region' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Город' }), {
    target: { value: 'Алматы' },
  });
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Доступность / срок' }),
    { target: { value: 'С октября' } }
  );
  fireEvent.click(screen.getByRole('button', { name: 'Добавить возможность' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Метод' }), {
    target: { value: 'CORE' },
  });
  expect(screen.getByRole('combobox', { name: 'Метод' })).toHaveValue('CORE');
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Типоразмер керновой системы' }),
    { target: { value: 'HQ' } }
  );
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Источник параметров' }),
    { target: { value: 'OWNER' } }
  );
  expect(
    screen.getByRole('combobox', { name: 'Источник параметров' })
  ).toHaveValue('OWNER');
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Имя для связи *' }), {
    target: { value: 'Ерлан' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Компания' }), {
    target: { value: 'OWNER' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Телефон *' }), {
    target: { value: '+77000000000' },
  });
  fireEvent.click(screen.getByRole('radio', { name: 'Нет, только редакции' }));
  expect(sessionStorage.getItem('qaznedr:equipment-intake:v2')).not.toContain(
    'Ерлан'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  expect(screen.getByText('Колонковое')).toBeInTheDocument();
  expect(screen.getByText('HQ')).toBeInTheDocument();
  expect(screen.getByText('Владелец')).toBeInTheDocument();
  expect(screen.getByText('NEW')).toBeInTheDocument();
  expect(screen.getByText('OWNER')).toBeInTheDocument();
  expect(screen.getByText('Сдаю в аренду')).toBeInTheDocument();
});

it('rejects an empty image before making an upload request', () => {
  mockSessionStatus = 'authenticated';
  mockSessionUserId = 'owner-a';
  const view = render(<EquipmentIntake locale="ru" googleEnabled={true} />);
  fireEvent.click(screen.getByRole('radio', { name: 'Компрессоры и насосы' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Сдаю в аренду' }));
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  const input = view.container.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  fireEvent.change(input, {
    target: { files: [new File([], 'empty.jpg', { type: 'image/jpeg' })] },
  });
  expect(screen.getByRole('status')).toHaveTextContent('Файл не подходит');
});

it('does not persist contact fields during a photo upload after visiting contact step', async () => {
  mockSessionStatus = 'authenticated';
  mockSessionUserId = 'owner-a';
  mockClient.upload.mockResolvedValue({
    id: '22222222-2222-4222-8222-222222222222',
    width: 1,
    height: 1,
    bytes: 1,
    position: 0,
  });
  const view = render(<EquipmentIntake locale="ru" googleEnabled={true} />);
  fireEvent.click(screen.getByRole('radio', { name: 'Компрессоры и насосы' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Сдаю в аренду' }));
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Тип техники *' }), {
    target: { value: 'COMPRESSOR' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Название *' }), {
    target: { value: 'Compressor' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Область *' }), {
    target: { value: 'almaty-region' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Город' }), {
    target: { value: 'Almaty' },
  });
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Доступность / срок' }),
    { target: { value: 'Now' } }
  );
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Имя для связи *' }), {
    target: { value: 'Private Person' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Телефон *' }), {
    target: { value: '+77000000000' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
  const input = view.container.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  fireEvent.change(input, {
    target: { files: [new File(['x'], 'rig.jpg', { type: 'image/jpeg' })] },
  });
  await waitFor(() => expect(mockClient.upload).toHaveBeenCalledTimes(1));
  expect(mockClient.upload.mock.calls[0][1]).not.toHaveProperty('contactName');
  expect(mockClient.upload.mock.calls[0][1]).not.toHaveProperty('phone');
});

it('asks for the section first and offers the actions that section allows', () => {
  render(<EquipmentIntake locale="ru" googleEnabled={true} />);
  expect(screen.queryByRole('radio', { name: 'Сдаю в аренду' })).toBeNull();
  fireEvent.click(
    screen.getByRole('radio', { name: 'Буровой инструмент и запчасти' })
  );
  expect(screen.getByRole('radio', { name: 'Продаю' })).toBeInTheDocument();
  expect(screen.queryByRole('radio', { name: 'Сдаю в аренду' })).toBeNull();
  fireEvent.click(
    screen.getByRole('radio', { name: 'Специалисты и вакансии' })
  );
  expect(
    screen.getByRole('radio', { name: 'Ищу работу (резюме)' })
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('radio', { name: 'Ищу сотрудника (вакансия)' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
  expect(
    screen.getByRole('combobox', { name: 'Профессия *' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('combobox', { name: 'Формат работы' })
  ).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Название *' })).toHaveAttribute(
    'placeholder',
    'Например: Требуется помощник бурильщика на сезон'
  );
  expect(screen.queryByText('Дополнительные параметры')).toBeNull();
});

it('returns a visitor to the same step with picked regions after sign-in', () => {
  sessionStorage.setItem(
    'qaznedr:equipment-intake:v2',
    JSON.stringify({
      ownerId: null,
      value: {
        offerType: 'SERVICE',
        category: 'geophysService',
        title: 'Электроразведка ВП',
        region: 'karagandy',
        serviceMethods: ['IP'],
        serviceArea: ['karagandy', 'ulytau'],
      },
    })
  );
  sessionStorage.setItem('qaznedr:equipment-intake:step', '2');
  render(<EquipmentIntake locale="ru" googleEnabled={true} />);
  expect(screen.getByText('Шаг 2 из 4')).toBeInTheDocument();
  expect(
    screen.getByRole('checkbox', { name: 'ВП (вызванная поляризация)' })
  ).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Улытауская' })).toBeChecked();
});
