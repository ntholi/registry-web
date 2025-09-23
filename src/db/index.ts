import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import * as relations from './relations';

const client = createClient(
  process.env.TURSO_DATABASE_URL
    ? {
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }
    : {
        url: 'file:local.db',
      }
);

const db = drizzle(client, {
  schema: { ...schema, ...relations },
  casing: 'snake_case',
});

export { db };
