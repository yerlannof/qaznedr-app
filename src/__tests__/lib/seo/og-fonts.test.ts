/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('node:fs', () => ({
  readFileSync: jest.fn(() => Buffer.from('font')),
}));
import { readFileSync } from 'node:fs';

it('does not read OG files when Next imports image metadata for a normal page', () => {
  const fonts = require('@/lib/seo/og-fonts');
  expect(readFileSync).not.toHaveBeenCalled();
  expect(fonts.getOgFonts()).toHaveLength(4);
  expect(readFileSync).toHaveBeenCalledTimes(4);
  fonts.getOgFonts();
  expect(readFileSync).toHaveBeenCalledTimes(4);
});
