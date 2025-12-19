import { vi } from 'vitest';
import type { users } from '@/core/database';

type User = Partial<typeof users.$inferSelect>;

let mockedUser: User = {
	id: 'test-user',
	name: 'Test User',
	role: 'user',
	position: null,
	email: 'test@example.com',
	emailVerified: null,
	image: null,
};

export function getMockUser() {
	return mockedUser;
}

export function setMockUser(user: User) {
	mockedUser = user;
}

export function resetMockUser() {
	mockedUser = {
		id: 'test-user',
		name: 'Test User',
		role: 'user',
		position: null,
		email: 'test@example.com',
		emailVerified: null,
		image: null,
	};
}

export const auth = vi.fn(() => Promise.resolve({ user: mockedUser }));
