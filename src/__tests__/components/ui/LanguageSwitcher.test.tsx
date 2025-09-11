import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { I18nProvider } from '@/contexts/i18n-context';
import { i18nConfig } from '@/lib/utils/i18n.config';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider initialLocale="en" initialDictionary={{}}>
    {children}
  </I18nProvider>
);

describe('LanguageSwitcher', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <LanguageSwitcher />
      </TestWrapper>
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('displays all available locales', () => {
    render(
      <TestWrapper>
        <LanguageSwitcher />
      </TestWrapper>
    );

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(i18nConfig.locales.length);

    i18nConfig.locales.forEach((locale, index) => {
      expect(options[index]).toHaveTextContent(i18nConfig.localeLabels[locale]);
    });
  });

  it('changes locale when a new option is selected', () => {
    render(
      <TestWrapper>
        <LanguageSwitcher />
      </TestWrapper>
    );

    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: 'ru' } });

    expect(select).toHaveValue('ru');
  });

  it('has the correct default value', () => {
    render(
      <TestWrapper>
        <LanguageSwitcher />
      </TestWrapper>
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('en');
  });
});
