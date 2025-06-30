import { beforeAll, beforeEach, afterAll } from 'vitest';
import { setupTestDatabase, cleanupTestDatabase } from '@/db/test-db';
import { vi } from 'vitest';

// Mock auth for tests - return admin user for all requests
vi.mock('@/auth', () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: {
        id: 'test-user',
        role: 'admin',
        email: 'test@example.com',
      },
    }),
  ),
}));

// Override the db import to use test database
vi.mock('@/db', async () => {
  const { testDb } = await vi.importActual('@/db/test-db');
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
