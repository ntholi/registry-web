import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as relations from './relations';

const sql = neon(process.env.DATABASE_URL!);

const db = drizzle(sql, {
  schema: { ...schema, ...relations },
  casing: 'snake_case',
});

export { db };
