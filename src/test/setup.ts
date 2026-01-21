import { afterAll, beforeAll, beforeEach, vi } from 'vitest';
import { resetMockUser } from './mocks.auth';
import {
	cleanupTestDatabase,
	closeTestDatabase,
	setupTestDatabase,
	testDb,
} from './mocks.db';

vi.mock('@/auth', () => vi.importActual('./mocks.auth'));

vi.mock('@/core/database', async () => {
	const actualDb =
		await vi.importActual<typeof import('@/core/database')>('@/core/database');
	return { ...actualDb, db: testDb };
});

let dbAvailable = false;

beforeAll(async () => {
	try {
		await setupTestDatabase();
		dbAvailable = true;
	} catch (error) {
		console.warn('Failed to setup test database:', error);
		dbAvailable = false;
	}
});

beforeEach(async () => {
	resetMockUser();
	if (dbAvailable) {
		try {
			await cleanupTestDatabase();
		} catch {
			dbAvailable = false;
		}
	}
});

afterAll(async () => {
	if (dbAvailable) {
		try {
			await cleanupTestDatabase();
			await closeTestDatabase();
		} catch (error) {
			console.warn('Failed to final cleanup:', error);
		}
	}
});
