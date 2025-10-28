import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import * as relations from './relations';

const client = createClient({
  url: 'file:local.db',
});

const db = drizzle(client, {
  schema: { ...schema, ...relations },
  casing: 'snake_case',
});

export { db };
