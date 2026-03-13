import { vi } from 'vitest';
import type { Session } from '@/core/auth';
import withPermission from '@/core/platform/withPermission';
import { getMockUser } from './mocks.auth';

type Role = 'all' | 'auth' | 'dashboard' | string;
type AccessCheckFunction = (session: Session) => Promise<boolean>;

vi.mock('@/core/auth', () => ({
	auth: vi.fn(() =>
		Promise.resolve({
			user: getMockUser(),
			expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			permissions: [],
			session: {
				id: 'test-session',
				userId: 'test-user',
				token: 'test-token',
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
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

async function mockWithPermissionImplementation<T>(
	fn: (session: Session | null) => Promise<T>,
	rolesOrAccessCheck: Role[] | AccessCheckFunction
): Promise<T> {
	return withPermission(fn, rolesOrAccessCheck as Role[]);
}

export const mockWithPermission = vi.fn(mockWithPermissionImplementation);

export default mockWithPermission;
