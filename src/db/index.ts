import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool } from '@neondatabase/serverless';
import { Pool as NodePool } from 'pg';
import * as relations from './relations';
import * as schema from './schema';

const databaseEnv = process.env.DATABASE_ENV || 'local';
const connectionString =
  databaseEnv === 'remote'
    ? process.env.DATABASE_REMOTE_URL!
    : process.env.DATABASE_LOCAL_URL!;

let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzleNode>;

if (databaseEnv === 'remote') {
  const pool = new NeonPool({ connectionString });
  db = drizzleNeon(pool, {
    schema: { ...schema, ...relations },
    casing: 'snake_case',
  });
} else {
  const pool = new NodePool({ connectionString });
  db = drizzleNode(pool, {
    schema: { ...schema, ...relations },
    casing: 'snake_case',
  });
}

export { db };
