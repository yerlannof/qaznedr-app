import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { translate } from '@/lib/i18n/translations';
const setTheme = jest.fn();
let locale = 'en';
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme }),
}));
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => translate(locale, key) }),
}));
it.each([
  ['ru', 'Переключить тему'],
  ['kz', 'Тақырыпты ауыстыру'],
  ['en', 'Switch theme'],
  ['zh', '切换主题'],
])('localizes and operates the %s theme button', (lang, label) => {
  locale = lang;
  setTheme.mockClear();
  render(<ThemeToggle />);
  fireEvent.click(screen.getByRole('button', { name: label }));
  expect(setTheme).toHaveBeenCalledWith('dark');
});
