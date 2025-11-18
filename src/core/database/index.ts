import { Pool as NeonPool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as NodePool } from 'pg';
import * as academic from '@/modules/academic/database';
import * as admin from '@/modules/admin/database';
import * as auth from '@/modules/auth/database';
import * as cmsSync from '@/modules/cms-sync/database';
import * as finance from '@/modules/finance/database';
import * as registry from '@/modules/registry/database';
import * as timetable from '@/modules/timetable/database';

const schema = {
	...academic,
	...admin,
	...auth,
	...cmsSync,
	...finance,
	...registry,
	...timetable,
};

const databaseEnv = process.env.DATABASE_ENV || 'local';
const connectionString =
	databaseEnv === 'remote'
		? process.env.DATABASE_REMOTE_URL!
		: process.env.DATABASE_LOCAL_URL!;

const neonDb = drizzleNeon(new NeonPool({ connectionString }), {
	schema,
	casing: 'snake_case',
});

const nodeDb = drizzleNode(new NodePool({ connectionString }), {
	schema,
	casing: 'snake_case',
});

const db = databaseEnv === 'remote' ? neonDb : nodeDb;

export { db };

export * from '@/modules/academic/database';
export * from '@/modules/admin/database';
export * from '@/modules/auth/database';
export * from '@/modules/cms-sync/database';
export * from '@/modules/finance/database';
export * from '@/modules/registry/database';
export * from '@/modules/timetable/database';
export * from './types';
