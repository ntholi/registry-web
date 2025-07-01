import { vi } from 'vitest';
import { getMockUser } from '@/test/mocks.auth';
import { dashboardUsers, UserRole } from '@/db/schema';
import { Session } from 'next-auth';

type Role = UserRole | 'all' | 'auth' | 'dashboard';

// Mock next/navigation functions
vi.mock('next/navigation', () => ({
  forbidden: vi.fn(() => {
    throw new Error('Forbidden');
  }),
  unauthorized: vi.fn(() => {
    throw new Error('Unauthorized');
  }),
}));

import { forbidden, unauthorized } from 'next/navigation';

export const mockWithAuth = vi.fn(
  async <T>(
    fn: (session?: Session | null) => Promise<T>,
    roles: Role[] = [],
    accessCheck?: (session: Session) => Promise<boolean>,
  ) => {
    const session = {
      user: getMockUser(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as Session;

    const callFnWithAccessCheck = async (session?: Session | null) => {
      if (accessCheck && session?.user) {
        const isAuthorized = await accessCheck(session);
        if (!isAuthorized && session.user.role !== 'admin') {
          return forbidden();
        }
      }
      return fn(session);
    };

    if (roles.length === 1 && roles.includes('all')) {
      return callFnWithAccessCheck(session);
    }

    if (!session?.user) {
      return unauthorized();
    }

    if (roles.includes('auth') && session?.user) {
      return callFnWithAccessCheck(session);
    }

    if (
      roles.includes('dashboard') &&
      dashboardUsers.includes(
        session?.user?.role as (typeof dashboardUsers)[number],
      )
    ) {
      return callFnWithAccessCheck(session);
    }

    if (!['admin', ...roles].includes(session.user.role as Role)) {
      if (roles.length === 0) {
        return unauthorized();
      }
      return forbidden();
    }

    return callFnWithAccessCheck(session);
  },
);

export default mockWithAuth;
