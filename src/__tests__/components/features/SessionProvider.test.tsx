import { render, screen } from '@testing-library/react';
import { SessionProvider } from '@/components/features/SessionProvider';

jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-session-provider">{children}</div>
  ),
}));

describe('SessionProvider', () => {
  it('renders children within NextAuth SessionProvider', () => {
    const testContent = 'Test child content';

    render(
      <SessionProvider>
        <div>{testContent}</div>
      </SessionProvider>
    );

    expect(screen.getByTestId('mock-session-provider')).toBeInTheDocument();
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('passes children correctly to NextAuthSessionProvider', () => {
    const TestComponent = () => <div>Test Component</div>;

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});
