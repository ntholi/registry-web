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
	fn: (session: Session | null) => Promise<T>,
	rolesOrAccessCheck: Role[] | AccessCheckFunction
): Promise<T> {
	return withPermission(fn, rolesOrAccessCheck as Role[]);
}

export const mockWithAuth = vi.fn(mockWithAuthImplementation);

export default mockWithAuth;
