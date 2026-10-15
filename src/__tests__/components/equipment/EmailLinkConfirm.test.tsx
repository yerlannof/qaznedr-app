import { act, fireEvent, render, screen } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import EmailLinkConfirm from '@/components/equipment/EmailLinkConfirm';

jest.mock('next-auth/react', () => ({ signIn: jest.fn() }));
const mockSignIn = signIn as jest.Mock;
const token = 'A'.repeat(43);

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState(null, '', `/ru/auth/email?next=x#token=${token}`);
});

it('reads the token from the fragment, clears it, and signs in on press', async () => {
  const navigate = jest.fn();
  mockSignIn.mockResolvedValue({ ok: true, error: null });
  render(
    <EmailLinkConfirm locale="ru" next="/ru/equipment/my" navigate={navigate} />
  );
  expect(window.location.hash).toBe('');
  expect(mockSignIn).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));
  });
  expect(mockSignIn).toHaveBeenCalledWith('email-link', {
    token,
    redirect: false,
    callbackUrl: '/ru/equipment/my',
  });
  expect(navigate).toHaveBeenCalledWith('/ru/equipment/my');
});

it('explains a Google-linked address', async () => {
  mockSignIn.mockResolvedValue({ ok: false, error: 'GOOGLE_ACCOUNT' });
  render(
    <EmailLinkConfirm
      locale="ru"
      next="/ru/equipment/my"
      navigate={jest.fn()}
    />
  );
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Войдите через Google');
});

it('offers a new link when the token is missing or spent', async () => {
  window.history.replaceState(null, '', '/ru/auth/email');
  render(
    <EmailLinkConfirm
      locale="ru"
      next="/ru/equipment/my"
      navigate={jest.fn()}
    />
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Запросите новую');
  expect(
    screen.getByRole('link', { name: 'Запросить новую ссылку' })
  ).toHaveAttribute('href', '/ru/equipment/my');
});
