import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import ConsentManager from '@/components/analytics/ConsentManager';
import ConsentSettingsButton from '@/components/analytics/ConsentSettingsButton';
import { CONSENT_KEY, writeConsent } from '@/lib/analytics/consent';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
jest.mock('@/lib/analytics/providers', () => ({
  syncProviders: jest.fn(),
  revokeProviders: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  (usePathname as jest.Mock).mockReturnValue('/ru/contact');
});

it('offers equal accept/reject controls; settings can opt in and later withdraw with focus return', () => {
  render(
    <>
      <ConsentManager locale="ru" />
      <ConsentSettingsButton label="Настройки аналитики" />
    </>
  );
  expect(
    screen.getByRole('button', { name: 'Принять аналитику' })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Отклонить' }));
  expect(
    screen.queryByRole('button', { name: 'Принять аналитику' })
  ).not.toBeInTheDocument();
  const footer = screen.getByRole('button', { name: 'Настройки аналитики' });
  expect(footer).not.toHaveFocus();
  footer.focus();
  fireEvent.click(footer);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  const analytics = screen.getByRole('checkbox', { name: /Аналитика/ });
  const advertising = screen.getByRole('checkbox', { name: /Реклама/ });
  expect(analytics).not.toBeChecked();
  expect(advertising).toBeDisabled();
  fireEvent.click(analytics);
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить выбор' }));
  expect(footer).toHaveFocus();
  fireEvent.click(footer);
  expect(screen.getByRole('checkbox', { name: /Аналитика/ })).toBeChecked();
  fireEvent.click(screen.getByRole('checkbox', { name: /Аналитика/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить выбор' }));
  expect(JSON.parse(localStorage.getItem('qaznedr_consent')!).analytics).toBe(
    false
  );
});

it('does not render controls on private routes', () => {
  (usePathname as jest.Mock).mockReturnValue('/ru/admin');
  render(
    <>
      <ConsentManager locale="ru" />
      <ConsentSettingsButton label="Настройки аналитики" />
    </>
  );
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('closes settings with Escape and restores the footer focus', () => {
  writeConsent(false);
  render(
    <>
      <ConsentManager locale="ru" />
      <ConsentSettingsButton label="Настройки аналитики" />
    </>
  );
  const footer = screen.getByRole('button', { name: 'Настройки аналитики' });
  footer.focus();
  fireEvent.click(footer);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(footer).toHaveFocus();
});

it.each(['Escape', 'Back'])(
  'restores the banner Settings focus after %s',
  (action) => {
    render(<ConsentManager locale="ru" />);
    const opener = screen.getByRole('button', { name: 'Настройки' });
    opener.focus();
    fireEvent.click(opener);
    if (action === 'Escape')
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    else fireEvent.click(screen.getByRole('button', { name: 'Вернуться' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Настройки' })).toHaveFocus();
  }
);

it('reopens consent when the stored decision expires during an open page', () => {
  writeConsent(true);
  render(<ConsentManager locale="ru" />);
  expect(
    screen.queryByRole('button', { name: 'Принять аналитику' })
  ).not.toBeInTheDocument();
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({
      version: 1,
      decidedAt: 1,
      analytics: true,
      advertising: false,
    })
  );
  fireEvent(document, new Event('visibilitychange'));
  expect(
    screen.getByRole('button', { name: 'Принять аналитику' })
  ).toBeInTheDocument();
});
