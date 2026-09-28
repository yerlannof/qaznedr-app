import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import ConsentManager from '@/components/analytics/ConsentManager';
import ConsentSettingsButton from '@/components/analytics/ConsentSettingsButton';
import { revokeProviders, syncProviders } from '@/lib/analytics/providers';
import { CONSENT_KEY, writeConsent } from '@/lib/analytics/consent';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
jest.mock('@/lib/analytics/providers', () => ({
  syncProviders: jest.fn(),
  revokeProviders: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  (usePathname as jest.Mock).mockReturnValue('/ru/contact');
});

it('stays unobtrusive until footer settings open, then permits opt-in and withdrawal', () => {
  render(
    <>
      <ConsentManager locale="ru" />
      <ConsentSettingsButton label="Настройки аналитики" />
    </>
  );
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(syncProviders).toHaveBeenCalledWith('/ru/contact', false);
  expect(localStorage.getItem(CONSENT_KEY)).toBeNull();
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

it.each(['ru', 'kz', 'en', 'zh'])(
  'does not interrupt a first visit or navigation in %s',
  (locale) => {
    (usePathname as jest.Mock).mockReturnValue(`/${locale}`);
    const { rerender } = render(<ConsentManager locale={locale} />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    (usePathname as jest.Mock).mockReturnValue(
      `/${locale}/services/geological`
    );
    rerender(<ConsentManager locale={locale} />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(syncProviders).toHaveBeenLastCalledWith(
      `/${locale}/services/geological`,
      false
    );
    expect(localStorage.getItem(CONSENT_KEY)).toBeNull();
  }
);

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
  'restores footer focus for an undecided visitor after %s',
  (action) => {
    render(
      <>
        <ConsentManager locale="ru" />
        <ConsentSettingsButton label="Настройки аналитики" />
      </>
    );
    const opener = screen.getByRole('button', { name: 'Настройки аналитики' });
    opener.focus();
    fireEvent.click(opener);
    if (action === 'Escape')
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    else fireEvent.click(screen.getByRole('button', { name: 'Вернуться' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(localStorage.getItem(CONSENT_KEY)).toBeNull();
  }
);

it('stops providers without showing a banner when the stored decision expires', () => {
  writeConsent(true);
  render(<ConsentManager locale="ru" />);
  expect(syncProviders).toHaveBeenCalledWith('/ru/contact', true);
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
    screen.queryByRole('button', { name: 'Принять аналитику' })
  ).not.toBeInTheDocument();
  expect(revokeProviders).toHaveBeenCalled();
});
