import { beforeAll, beforeEach, afterAll } from 'vitest';
import { setupTestDatabase, cleanupTestDatabase } from '@/db/test-db';
import { vi } from 'vitest';
import { resetMockUser } from './mocks';

// Mock auth for tests - return admin user for all requests
vi.mock('@/auth', () => vi.importActual('./mocks'));

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
