import { beforeAll, beforeEach, afterAll } from 'vitest';
import { setupTestDatabase, cleanupTestDatabase } from './mocks.db';
import { vi } from 'vitest';
import { resetMockUser } from './mocks.auth';

vi.mock('@/auth', () => vi.importActual('./mocks.auth'));

vi.mock('@/db', async () => {
  const { testDb } = await vi.importActual('./mocks.db');
  return { db: testDb };
});

beforeAll(async () => {
  try {
    await setupTestDatabase();
  } catch (error) {
    console.warn('Failed to setup test database:', error);
  }
});

beforeEach(async () => {
  try {
    await cleanupTestDatabase();
    resetMockUser();
  } catch (error) {
    console.warn('Failed to cleanup test database:', error);
  }
});

afterAll(async () => {
  try {
    await cleanupTestDatabase();
  } catch (error) {
    console.warn('Failed to final cleanup:', error);
  }
});
