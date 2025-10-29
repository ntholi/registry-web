import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as relations from './relations';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

const db = drizzle(pool, {
  schema: { ...schema, ...relations },
  casing: 'snake_case',
});

export { db };
