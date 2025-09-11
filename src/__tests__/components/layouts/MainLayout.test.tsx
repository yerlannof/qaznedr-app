import { render, screen } from '@testing-library/react';
import { MainLayout } from '@/components/layouts/MainLayout';

describe('MainLayout', () => {
  it('renders children correctly', () => {
    const testContent = 'Test content';

    render(
      <MainLayout>
        <div>{testContent}</div>
      </MainLayout>
    );

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    const mainWrapper = container.firstChild;
    expect(mainWrapper).toHaveClass('min-h-screen', 'flex', 'flex-col');
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-test-class';

    const { container } = render(
      <MainLayout className={customClass}>
        <div>Content</div>
      </MainLayout>
    );

    const mainWrapper = container.firstChild;
    expect(mainWrapper).toHaveClass(customClass);
  });

  it('renders main element with flex-1 class', () => {
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('flex-1');
  });
});
