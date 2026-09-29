import { render, screen } from '@testing-library/react';
import BrandIllustration from '@/components/features/BrandIllustration';

it('uses the correct intrinsic sizes and empty alternative text for both decorative illustrations', () => {
  const { rerender } = render(<BrandIllustration kind="archive" />);
  expect(screen.getByRole('presentation').getAttribute('src')).toContain(
    'archive-to-field-chalk-1536.webp'
  );
  expect(screen.getByRole('presentation')).toHaveAttribute('width', '1536');
  expect(screen.getByRole('presentation')).toHaveAttribute('height', '1024');
  rerender(<BrandIllustration kind="cutaway" />);
  expect(screen.getByRole('presentation').getAttribute('src')).toContain(
    'geology-cutaway-960.webp'
  );
  expect(screen.getByRole('presentation')).toHaveAttribute('width', '960');
  expect(screen.getByRole('presentation')).toHaveAttribute('height', '480');
});
