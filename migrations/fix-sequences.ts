import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';

config({ path: '.env.local' });

const databaseEnv = process.env.DATABASE_ENV || 'local';
process.env.DATABASE_URL =
	databaseEnv === 'remote'
		? process.env.DATABASE_REMOTE_URL!
		: process.env.DATABASE_LOCAL_URL!;

type SequenceConfig = {
	readonly tableName: string;
	readonly sequenceName: string;
	readonly columnName: string;
};

const sequences: ReadonlyArray<SequenceConfig> = [
	{
		tableName: 'student_programs',
		sequenceName: 'student_programs_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'student_semesters',
		sequenceName: 'student_semesters_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'student_modules',
		sequenceName: 'student_modules_id_seq',
		columnName: 'id',
	},
	{ tableName: 'schools', sequenceName: 'schools_id_seq', columnName: 'id' },
	{ tableName: 'programs', sequenceName: 'programs_id_seq', columnName: 'id' },
	{
		tableName: 'structures',
		sequenceName: 'structures_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'structure_semesters',
		sequenceName: 'structure_semesters_id_seq',
		columnName: 'id',
	},
	{ tableName: 'modules', sequenceName: 'modules_id_seq', columnName: 'id' },
	{
		tableName: 'semester_modules',
		sequenceName: 'semester_modules_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'module_prerequisites',
		sequenceName: 'module_prerequisites_id_seq',
		columnName: 'id',
	},
	{ tableName: 'terms', sequenceName: 'terms_id_seq', columnName: 'id' },
	{
		tableName: 'registration_requests',
		sequenceName: 'registration_requests_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'requested_modules',
		sequenceName: 'requested_modules_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'clearance',
		sequenceName: 'clearance_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'registration_clearance',
		sequenceName: 'registration_clearance_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'graduation_requests',
		sequenceName: 'graduation_requests_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'graduation_clearance',
		sequenceName: 'graduation_clearance_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'payment_receipts',
		sequenceName: 'payment_receipts_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'clearance_audit',
		sequenceName: 'clearance_audit_id_seq',
		columnName: 'id',
	},
	{ tableName: 'sponsors', sequenceName: 'sponsors_id_seq', columnName: 'id' },
	{
		tableName: 'sponsored_students',
		sequenceName: 'sponsored_students_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'sponsored_terms',
		sequenceName: 'sponsored_terms_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'assigned_modules',
		sequenceName: 'assigned_modules_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'user_schools',
		sequenceName: 'user_schools_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'assessments',
		sequenceName: 'assessments_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'assessment_marks',
		sequenceName: 'assessment_marks_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'assessment_marks_audit',
		sequenceName: 'assessment_marks_audit_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'assessments_audit',
		sequenceName: 'assessments_audit_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'module_grades',
		sequenceName: 'module_grades_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'blocked_students',
		sequenceName: 'blocked_students_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'fortinet_registrations',
		sequenceName: 'fortinet_registrations_id_seq',
		columnName: 'id',
	},
	{
		tableName: 'task_assignments',
		sequenceName: 'task_assignments_id_seq',
		columnName: 'id',
	},
] as const;

function assertEnvironment(): void {
	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set in the environment.');
	}
}

async function openDatabase(): Promise<
	ReturnType<typeof drizzle<typeof schema>>
> {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	return drizzle(pool, { schema, casing: 'snake_case' });
}

async function closeDatabase(
	db: ReturnType<typeof drizzle<typeof schema>>
): Promise<void> {
	await db.$client.end();
}

async function fixSequence(
	db: ReturnType<typeof drizzle<typeof schema>>,
	config: SequenceConfig
): Promise<void> {
	const result = await db.$client.query(
		`SELECT MAX(${config.columnName}) as max_id FROM ${config.tableName}`
	);

	const maxId = result.rows[0]?.max_id;

	if (maxId === null || maxId === undefined) {
		return;
	}

	const nextVal = maxId + 1;
	await db.$client.query(`SELECT setval('${config.sequenceName}', $1, false)`, [
		nextVal,
	]);
}

async function verifySequence(
	db: ReturnType<typeof drizzle<typeof schema>>,
	config: SequenceConfig
): Promise<{ valid: boolean; maxId: number | null }> {
	const seqResult = await db.$client.query(
		`SELECT last_value, is_called FROM ${config.sequenceName}`
	);
	const lastValue = seqResult.rows[0]?.last_value;
	const isCalled = seqResult.rows[0]?.is_called;

	const maxResult = await db.$client.query(
		`SELECT MAX(${config.columnName}) as max_id FROM ${config.tableName}`
	);
	const maxId = maxResult.rows[0]?.max_id;

	if (maxId === null || maxId === undefined) {
		return { valid: true, maxId: null };
	}

	const currentSequenceValue = isCalled ? lastValue : lastValue - 1;
	const valid = currentSequenceValue >= maxId;

	return { valid, maxId };
}

async function run(): Promise<void> {
	assertEnvironment();
	console.log('\n🔧 Fixing PostgreSQL sequences...\n');

	const db = await openDatabase();

	try {
		console.log('Checking sequence integrity...');
		const invalidSequences: string[] = [];

		for (const config of sequences) {
			const { valid, maxId } = await verifySequence(db, config);
			if (!valid && maxId !== null) {
				invalidSequences.push(config.tableName);
			}
		}

		if (invalidSequences.length === 0) {
			console.log('✓ All sequences are already correct.\n');
			return;
		}

		console.log(`Found ${invalidSequences.length} sequence(s) to fix.`);

		console.log('Updating sequences to match current data...');
		for (const config of sequences) {
			await fixSequence(db, config);
		}

		console.log('Verifying fixes...');
		let allValid = true;
		for (const config of sequences) {
			const { valid } = await verifySequence(db, config);
			if (!valid) {
				allValid = false;
			}
		}

		if (allValid) {
			console.log(
				`✓ Fixed ${invalidSequences.length} sequence(s) successfully.\n`
			);
		} else {
			console.log('\n✗ Some sequences could not be fixed!\n');
			process.exit(1);
		}
	} finally {
		await closeDatabase(db);
	}
}

run().catch(function handleError(error) {
	console.error('Sequence fix script failed.');
	console.error(error);
	process.exit(1);
});
