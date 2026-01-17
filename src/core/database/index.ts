import 'server-only';

import * as academic from '@academic/_database';
import * as admin from '@admin/_database';
import * as admissions from '@admissions/_database';
import * as auditLogs from '@audit-logs/_database';
import * as auth from '@auth/_database';
import * as finance from '@finance/_database';
import * as library from '@library/_database';
import { Pool as NeonPool } from '@neondatabase/serverless';
import * as registry from '@registry/_database';
import * as timetable from '@timetable/_database';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as NodePool } from 'pg';

const schema = {
	...academic,
	...admin,
	...admissions,
	...auth,
	...auditLogs,
	...finance,
	...library,
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

export * from '@academic/_database';
export * from '@admin/_database';
export * from '@admissions/_database';
export * from '@audit-logs/_database';
export * from '@auth/_database';
export * from '@finance/_database';
export * from '@library/_database';
export * from '@registry/_database';
export * from '@timetable/_database';
export * from './types';
