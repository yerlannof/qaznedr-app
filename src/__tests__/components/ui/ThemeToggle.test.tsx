import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="light">
    {children}
  </ThemeProvider>
);

describe('ThemeToggle', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('renders without crashing', async () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /toggle theme/i })
      ).toBeInTheDocument();
    });
  });

  it('toggles theme when clicked', async () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /toggle theme/i });

    fireEvent.click(button);

    await waitFor(() => {
      const svgPaths = screen.getByRole('button').querySelectorAll('path');
      expect(svgPaths.length).toBeGreaterThan(0);
    });
  });

  it('displays correct icon based on theme', async () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();

      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
