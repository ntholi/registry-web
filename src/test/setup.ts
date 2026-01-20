import { afterAll, beforeAll, beforeEach, vi } from 'vitest';
import * as actualDb from '@/core/database';
import { resetMockUser } from './mocks.auth';
import {
	cleanupTestDatabase,
	closeTestDatabase,
	setupTestDatabase,
	testDb,
} from './mocks.db';

vi.mock('@/auth', () => vi.importActual('./mocks.auth'));

vi.mock('@/core/database', () => {
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
