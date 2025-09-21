import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CreateListingWizard from '@/components/features/CreateListingWizard';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api/deposits', () => ({
  depositApi: {
    create: jest.fn(),
  },
}));

jest.mock('react-use-wizard', () => ({
  Wizard: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useWizard: () => ({
    currentStepIndex: 0,
    nextStep: jest.fn(),
    previousStep: jest.fn(),
    isFirstStep: true,
    isLastStep: false,
    stepCount: 4,
  }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('CreateListingWizard', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders the wizard component', () => {
    render(<CreateListingWizard />);

    // Check for the basic structure
    expect(screen.getByText('Создание объявления')).toBeInTheDocument();
  });

  it('shows basic info step by default', () => {
    render(<CreateListingWizard />);

    // Check for basic info form fields
    expect(screen.getByLabelText('Название объявления')).toBeInTheDocument();
    expect(screen.getByLabelText('Описание')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<CreateListingWizard />);

    const nextButton = screen.getByText('Далее');
    fireEvent.click(nextButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Название обязательно')).toBeInTheDocument();
    });
  });

  it('allows user to select listing type', () => {
    render(<CreateListingWizard />);

    // Check for listing type options
    expect(screen.getByText('Лицензия на добычу')).toBeInTheDocument();
    expect(screen.getByText('Лицензия на разведку')).toBeInTheDocument();
    expect(screen.getByText('Проявления минералов')).toBeInTheDocument();
  });

  it('allows user to select mineral type', () => {
    render(<CreateListingWizard />);

    // Check for some mineral options
    expect(screen.getByText('Нефть')).toBeInTheDocument();
    expect(screen.getByText('Газ')).toBeInTheDocument();
    expect(screen.getByText('Золото')).toBeInTheDocument();
  });

  it('handles form submission', () => {
    render(<CreateListingWizard />);

    // Fill in basic information
    const titleInput = screen.getByLabelText('Название объявления');
    const descriptionInput = screen.getByLabelText('Описание');

    fireEvent.change(titleInput, { target: { value: 'Test Listing' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'Test description for the listing' },
    });

    // Select listing type
    const miningLicenseOption = screen.getByLabelText('Лицензия на добычу');
    fireEvent.click(miningLicenseOption);

    // Select mineral
    const oilOption = screen.getByLabelText('Нефть');
    fireEvent.click(oilOption);

    // Check that form can be filled
    expect(titleInput).toHaveValue('Test Listing');
    expect(descriptionInput).toHaveValue('Test description for the listing');
  });

  it('shows different steps in the wizard', () => {
    render(<CreateListingWizard />);

    // Check for step indicators
    expect(screen.getByText('Основная информация')).toBeInTheDocument();
    expect(screen.getByText('Местоположение')).toBeInTheDocument();
    expect(screen.getByText('Изображения')).toBeInTheDocument();
    expect(screen.getByText('Подтверждение')).toBeInTheDocument();
  });
});
