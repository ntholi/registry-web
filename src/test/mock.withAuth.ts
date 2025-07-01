import { vi } from 'vitest';
import { getMockUser } from '@/test/mocks.auth';

export const mockWithAuth = vi.fn(
  async (fn: Function, roles: string[] = []) => {
    const user = getMockUser();

    if (roles.includes('all')) {
      return fn();
    }

    if (!user) {
      throw new Error('Unauthorized');
    }

    if (roles.length === 0 && user?.role === 'admin') {
      return fn();
    }

    if (user?.role === 'admin') {
      return fn();
    }

    if (user?.role && roles.includes(user.role)) {
      return fn();
    }

    throw new Error('Unauthorized');
  },
);

export default mockWithAuth;
