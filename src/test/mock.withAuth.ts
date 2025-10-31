import type { Session } from 'next-auth';
import { vi } from 'vitest';
import type { UserRole } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import { getMockUser } from '@/test/mocks.auth';

type Role = UserRole | 'all' | 'auth' | 'dashboard';

vi.mock('@/auth', () => ({
	auth: vi.fn(() =>
		Promise.resolve({
			user: getMockUser(),
			expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
		})
	),
}));

vi.mock('next/navigation', () => ({
	forbidden: vi.fn(() => {
		throw new Error('Forbidden');
	}),
	unauthorized: vi.fn(() => {
		throw new Error('Unauthorized');
	}),
}));

export const mockWithAuth = vi.fn(
	async <T>(
		fn: (session?: Session | null) => Promise<T>,
		roles: Role[] = [],
		accessCheck?: (session: Session) => Promise<boolean>
	) => {
		return withAuth(fn, roles, accessCheck);
	}
);

export default mockWithAuth;
