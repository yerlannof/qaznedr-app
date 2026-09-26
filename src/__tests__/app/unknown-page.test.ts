/** @jest-environment node */
import UnknownPage from '@/app/[locale]/[...rest]/page';

// jest.setup mocks next/navigation without notFound; use the real one here.
jest.mock('next/navigation', () => jest.requireActual('next/navigation'));

describe('unknown paths under a locale', () => {
  it('hand over to [locale]/not-found (localized 404, status 404)', () => {
    expect(() => UnknownPage()).toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });
});
