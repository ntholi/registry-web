import { afterAll, beforeAll, beforeEach, vi } from 'vitest';
import { resetMockUser } from './mocks.auth';
import {
	cleanupTestDatabase,
	closeTestDatabase,
	setupTestDatabase,
} from './mocks.db';

vi.mock('@/auth', () => vi.importActual('./mocks.auth'));

vi.mock('@/core/database', async () => {
	const actualDb = await import('@/core/database');
	const { testDb } = await vi.importActual('./mocks.db');
	return { ...actualDb, db: testDb };
});

beforeAll(async () => {
	try {
		await setupTestDatabase();
	} catch (error) {
		console.warn('Failed to setup test database:', error);
	}
});

beforeEach(async () => {
	resetMockUser();
	await cleanupTestDatabase();
});

afterAll(async () => {
	try {
		await cleanupTestDatabase();
		await closeTestDatabase();
	} catch (error) {
		console.warn('Failed to final cleanup:', error);
	}
});
