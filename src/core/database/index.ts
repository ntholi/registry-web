import * as academic from '@academic/_database';
import * as admin from '@admin/_database';
import * as admissions from '@admissions/_database';
import * as appraisals from '@appraisals/_database';
import * as auditLogs from '@audit-logs/_database';
import * as auth from '@auth/_database';
import * as finance from '@finance/_database';
import * as humanResource from '@human-resource/_database';
import * as library from '@library/_database';
import * as mail from '@mail/_database';
import { Pool as NeonPool } from '@neondatabase/serverless';
import * as registry from '@registry/_database';
import * as studentServices from '@student-services/_database';
import * as timetable from '@timetable/_database';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as NodePool } from 'pg';
import * as coreSchema from './schema/auditLogs';
import * as coreSchemaRelations from './schema/auditLogsRelations';

const schema = {
	...coreSchema,
	...coreSchemaRelations,
	...academic,
	...admin,
	...appraisals,
	...admissions,
	...auth,
	...auditLogs,
	...finance,
	...humanResource,
	...library,
	...mail,
	...registry,
	...studentServices,
	...timetable,
};

const databaseEnv = process.env.DATABASE_ENV || 'local';
const connectionString =
	databaseEnv === 'remote'
		? process.env.DATABASE_REMOTE_URL!
		: process.env.DATABASE_LOCAL_URL!;

const isScriptRuntime = /[\\/]scripts[\\/]/.test(process.argv[1] ?? '');
const remoteDriver = process.env.DATABASE_REMOTE_DRIVER || 'neon';
const useNodeDriver =
	databaseEnv !== 'remote' || isScriptRuntime || remoteDriver === 'node';

const neonDb = drizzleNeon(new NeonPool({ connectionString }), {
	schema,
	casing: 'snake_case',
});

const nodeDb = drizzleNode(new NodePool({ connectionString }), {
	schema,
	casing: 'snake_case',
});

const db = useNodeDriver ? nodeDb : neonDb;

export * from '@academic/_database';
export * from '@admin/_database';
export * from '@admissions/_database';
export * from '@appraisals/_database';
export * from '@audit-logs/_database';
export * from '@auth/_database';
export * from '@finance/_database';
export * from '@human-resource/_database';
export * from '@library/_database';
export * from '@mail/_database';
export * from '@registry/_database';
export * from '@student-services/_database';
export * from '@timetable/_database';
export * from './types';
export { db, schema };
