import { fireEvent, render, screen, within } from '@testing-library/react';
import ArticleToc from '@/components/insights/ArticleToc';

it('links to headings and moves focus beyond a closed mobile details', () => {
  const heading = document.createElement('h2');
  heading.id = 'section-1';
  heading.tabIndex = -1;
  document.body.appendChild(heading);
  try {
    render(
      <ArticleToc
        label="Contents"
        toc={[{ id: 'section-1', title: 'Gold & Copper', level: 2 }]}
      />
    );
    const details = screen.getByTestId(
      'mobile-article-toc'
    ) as HTMLDetailsElement;
    fireEvent.click(within(details).getByText('Contents'));
    expect(details.open).toBe(true);
    fireEvent.click(
      within(details).getByRole('link', { name: 'Gold & Copper' })
    );
    expect(details.open).toBe(false);
    expect(heading).toHaveFocus();
    expect(window.location.hash).toBe('#section-1');
  } finally {
    heading.remove();
  }
});
