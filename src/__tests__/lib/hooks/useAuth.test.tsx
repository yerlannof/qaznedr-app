import { renderHook, act } from '@testing-library/react';
import { hiddenRouteRedirect } from '@/lib/seo/pages';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/zh/auth/login',
}));
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  }),
  signIn: jest.fn().mockResolvedValue({ error: undefined }),
  signOut: jest.fn(),
}));

import { useAuth } from '@/lib/hooks/useAuth';

describe('useAuth.login', () => {
  beforeEach(() => push.mockClear());

  // The only accounts left are the owner/admins; /dashboard is a hidden
  // route that 308s to the portfolio, so login must land on the admin.
  it('sends the owner to the admin panel in the current locale', async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.login('owner@qaznedr.kz', 'secret');
    });
    expect(push).toHaveBeenCalledWith('/zh/admin');
    expect(hiddenRouteRedirect(push.mock.calls[0][0])).toBeNull();
  });
});
