import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ListingsFilters from '@/components/features/ListingsFilters';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock useTranslation
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'listings.filters': 'Фильтры',
        'listings.smartSearch': 'Умный поиск',
        'listings.listingType': 'Тип объявления',
        'listings.allTypes': 'Все типы',
        'listings.miningLicenses': 'Лицензии на добычу',
        'listings.explorationLicenses': 'Лицензии на разведку',
        'listings.mineralOccurrences': 'Проявления минералов',
        'listings.priceRange': 'Диапазон цен',
        'listings.clearFilters': 'Очистить',
      };
      return translations[key] || key;
    },
    locale: 'ru',
  }),
}));

// Mock fuse.js for AdvancedSearch
jest.mock('fuse.js', () => {
  return jest.fn().mockImplementation(() => ({
    search: jest.fn().mockReturnValue([]),
  }));
});

describe('ListingsFilters', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (usePathname as jest.Mock).mockReturnValue('/listings');
  });

  it('renders all filter sections on desktop', () => {
    render(<ListingsFilters />);

    expect(screen.getByText('Фильтры')).toBeInTheDocument();
    expect(screen.getByText('Умный поиск')).toBeInTheDocument();
    expect(screen.getByText('Тип объявления')).toBeInTheDocument();
    expect(screen.getByText('Диапазон цен')).toBeInTheDocument();
    expect(screen.getByText('Регион')).toBeInTheDocument();
  });

  it('shows correct listing type options', () => {
    render(<ListingsFilters />);

    expect(screen.getByText('Все типы')).toBeInTheDocument();
    expect(screen.getByText('Лицензии на добычу')).toBeInTheDocument();
    expect(screen.getByText('Лицензии на разведку')).toBeInTheDocument();
    expect(screen.getByText('Проявления минералов')).toBeInTheDocument();
  });

  it('calls router.push when mining license filter is selected', () => {
    render(<ListingsFilters />);

    const miningLicenseRadio = screen.getByDisplayValue('MINING_LICENSE');
    fireEvent.click(miningLicenseRadio);

    expect(mockPush).toHaveBeenCalledWith('/listings?type=MINING_LICENSE');
  });

  it('calls router.push when exploration license filter is selected', () => {
    render(<ListingsFilters />);

    const explorationLicenseRadio = screen.getByDisplayValue(
      'EXPLORATION_LICENSE'
    );
    fireEvent.click(explorationLicenseRadio);

    expect(mockPush).toHaveBeenCalledWith('/listings?type=EXPLORATION_LICENSE');
  });

  it('calls router.push when mineral occurrence filter is selected', () => {
    render(<ListingsFilters />);

    const mineralOccurrenceRadio =
      screen.getByDisplayValue('MINERAL_OCCURRENCE');
    fireEvent.click(mineralOccurrenceRadio);

    expect(mockPush).toHaveBeenCalledWith('/listings?type=MINERAL_OCCURRENCE');
  });

  it('calls router.push when verified filter is toggled', () => {
    render(<ListingsFilters />);

    // First need to expand the additional filters section
    const additionalFiltersButton = screen.getByText('Дополнительные фильтры');
    fireEvent.click(additionalFiltersButton);

    const verifiedCheckbox = screen.getByRole('checkbox');
    fireEvent.click(verifiedCheckbox);

    expect(mockPush).toHaveBeenCalledWith('/listings?verified=true');
  });

  it('clears all filters when clear button is clicked', () => {
    // Setup initial filters in URL
    const searchParamsWithFilters = new URLSearchParams(
      'type=MINING_LICENSE&region=Алматинская&verified=true'
    );
    (useSearchParams as jest.Mock).mockReturnValue(searchParamsWithFilters);

    render(<ListingsFilters />);

    const clearButton = screen.getByText('Очистить');
    fireEvent.click(clearButton);

    expect(mockPush).toHaveBeenCalledWith('/listings');
  });

  it('shows active filter count', () => {
    const searchParamsWithFilters = new URLSearchParams(
      'type=MINING_LICENSE&region=Алматинская'
    );
    (useSearchParams as jest.Mock).mockReturnValue(searchParamsWithFilters);

    render(<ListingsFilters />);

    // Should show badge with count 2
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('handles price range application', () => {
    render(<ListingsFilters />);

    // Expand price section
    const priceSection = screen.getByText('Диапазон цен');
    fireEvent.click(priceSection);

    // Find price inputs
    const minPriceInput = screen.getByPlaceholderText('Мин');
    const maxPriceInput = screen.getByPlaceholderText('Макс');

    fireEvent.change(minPriceInput, { target: { value: '100' } });
    fireEvent.change(maxPriceInput, { target: { value: '1000' } });

    const applyButton = screen.getByText('Применить');
    fireEvent.click(applyButton);

    expect(mockPush).toHaveBeenCalledWith(
      '/listings?priceMin=100&priceMax=1000'
    );
  });
});
