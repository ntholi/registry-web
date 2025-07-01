import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '../db/schema';
import * as relations from '../db/relations';

const testClient = createClient({
  url: 'file:test.db',
});

const testDb = drizzle(testClient, {
  schema: { ...schema, ...relations },
  casing: 'snake_case',
});

async function setupTestDatabase() {
  await migrate(testDb, { migrationsFolder: './drizzle' });
}

async function cleanupTestDatabase() {
  try {
    await testDb.delete(schema.terms);
  } catch (error) {}
}

export { testDb, setupTestDatabase, cleanupTestDatabase };
