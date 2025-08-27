import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import * as relations from './relations';

const client = process.env.TURSO_DATABASE_URL
  ? createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  : createClient({
      url: 'file:./local.db',
    });

const db = drizzle(client, {
  schema: { ...schema, ...relations },
  casing: 'snake_case',
});

export { db };
