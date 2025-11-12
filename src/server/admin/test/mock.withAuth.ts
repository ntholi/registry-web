import type { Session } from 'next-auth';
import { vi } from 'vitest';
import { getMockUser } from '@/server/admin/test/mocks.auth';
import withAuth from '@/server/base/withAuth';
import type { UserRole } from '@/shared/db/schema';

type Role = UserRole | 'all' | 'auth' | 'dashboard';
type AccessCheckFunction = (session: Session) => Promise<boolean>;

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

async function mockWithAuthImplementation<T>(
	fn: (session?: Session | null) => Promise<T>,
	rolesOrAccessCheck: Role[] | AccessCheckFunction
): Promise<T> {
	return withAuth(fn, rolesOrAccessCheck as Role[]);
}

export const mockWithAuth = vi.fn(mockWithAuthImplementation);

export default mockWithAuth;
