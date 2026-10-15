import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import MarketplaceSignIn from '@/components/equipment/MarketplaceSignIn';

jest.mock('next-auth/react', () => ({ signIn: jest.fn() }));

const reply = (status: number) =>
  jest.fn().mockResolvedValue({ ok: status < 300, status });

const renderSignIn = (fetcher: jest.Mock, extra = {}) =>
  render(
    <MarketplaceSignIn
      locale="ru"
      googleEnabled
      emailEnabled
      callbackUrl="/ru/equipment/new?draft=1"
      fetcher={fetcher as unknown as typeof fetch}
      {...extra}
    />
  );

beforeEach(() => jest.clearAllMocks());

it('puts Google first and returns to the same page', () => {
  renderSignIn(reply(200));
  const buttons = screen.getAllByRole('button');
  expect(buttons[0]).toHaveTextContent('Продолжить с Google');
  fireEvent.click(buttons[0]);
  expect(signIn).toHaveBeenCalledWith('google', {
    callbackUrl: '/ru/equipment/new?draft=1',
  });
});

it('requests an email link and confirms where it went', async () => {
  const fetcher = reply(200);
  renderSignIn(fetcher);
  fireEvent.change(screen.getByLabelText('Электронная почта'), {
    target: { value: 'driller@example.com' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Прислать ссылку для входа' })
  );
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Письмо отправлено на driller@example.com'
  );
  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe('/api/auth/email-link');
  expect(JSON.parse(init.body)).toEqual({
    email: 'driller@example.com',
    locale: 'ru',
    callbackUrl: '/ru/equipment/new?draft=1',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Указать другую почту' }));
  expect(screen.getByLabelText('Электронная почта')).toBeInTheDocument();
});

it.each([
  [429, 'Слишком много запросов'],
  [400, 'Проверьте адрес почты'],
  [502, 'Не удалось отправить письмо'],
])('shows a plain message for HTTP %s', async (status, text) => {
  renderSignIn(reply(status));
  fireEvent.change(screen.getByLabelText('Электронная почта'), {
    target: { value: 'a@example.com' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Прислать ссылку для входа' })
  );
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(text)
  );
});

it('hides the email form until delivery is configured', () => {
  renderSignIn(reply(200), { emailEnabled: false });
  expect(screen.queryByLabelText('Электронная почта')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Продолжить с Google' })
  ).toBeInTheDocument();
});

it('points to WhatsApp help when no sign-in is available', () => {
  renderSignIn(reply(200), { emailEnabled: false, googleEnabled: false });
  expect(screen.getByRole('status')).toHaveTextContent('WhatsApp');
});
