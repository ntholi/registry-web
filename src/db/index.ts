import { Pool as NeonPool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as NodePool } from 'pg';
import * as relations from './relations';
import * as schema from './schema';

const databaseEnv = process.env.DATABASE_ENV || 'local';
const connectionString =
	databaseEnv === 'remote'
		? process.env.DATABASE_REMOTE_URL!
		: process.env.DATABASE_LOCAL_URL!;

const neonDb = drizzleNeon(new NeonPool({ connectionString }), {
	schema: { ...schema, ...relations },
	casing: 'snake_case',
});

const nodeDb = drizzleNode(new NodePool({ connectionString }), {
	schema: { ...schema, ...relations },
	casing: 'snake_case',
});

const db = databaseEnv === 'remote' ? neonDb : nodeDb;

export { db };
