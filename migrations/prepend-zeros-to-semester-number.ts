import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/core/db/schema';

config({ path: '.env.local' });

const databaseEnv = process.env.DATABASE_ENV || 'local';
process.env.DATABASE_URL =
	databaseEnv === 'remote'
		? process.env.DATABASE_REMOTE_URL!
		: process.env.DATABASE_LOCAL_URL!;

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

async function updateSemesterNumbers(
	db: ReturnType<typeof drizzle<typeof schema>>
): Promise<void> {
	console.log('Updating registration_requests.semester_number...');
	const registrationResult = await db.$client.query(`
		UPDATE registration_requests
		SET semester_number = LPAD(semester_number, 2, '0')::char(2)
		WHERE LENGTH(semester_number) < 2
	`);
	console.log(
		`✓ Updated ${registrationResult.rowCount} rows in registration_requests`
	);

	console.log('Updating structure_semesters.semester_number...');
	const structureResult = await db.$client.query(`
		UPDATE structure_semesters
		SET semester_number = LPAD(semester_number, 2, '0')::char(2)
		WHERE LENGTH(semester_number) < 2
	`);
	console.log(
		`✓ Updated ${structureResult.rowCount} rows in structure_semesters`
	);
}

async function verifySemesterNumbers(
	db: ReturnType<typeof drizzle<typeof schema>>
): Promise<boolean> {
	console.log('Verifying semester_number values...');

	const registrationCheck = await db.$client.query(`
		SELECT COUNT(*) as count
		FROM registration_requests
		WHERE LENGTH(semester_number) < 2
	`);

	const structureCheck = await db.$client.query(`
		SELECT COUNT(*) as count
		FROM structure_semesters
		WHERE LENGTH(semester_number) < 2
	`);

	const registrationCount = parseInt(
		registrationCheck.rows[0]?.count || '0',
		10
	);
	const structureCount = parseInt(structureCheck.rows[0]?.count || '0', 10);

	if (registrationCount > 0 || structureCount > 0) {
		console.log(
			`✗ Found ${registrationCount} unprepended values in registration_requests`
		);
		console.log(
			`✗ Found ${structureCount} unprepended values in structure_semesters`
		);
		return false;
	}

	console.log('✓ All semester_number values are properly formatted');
	return true;
}

async function run(): Promise<void> {
	assertEnvironment();
	console.log('\n🔧 Prepending zeros to semester_number values...\n');

	const db = await openDatabase();

	try {
		const isValid = await verifySemesterNumbers(db);

		if (isValid) {
			console.log('✓ All semester_number values are already formatted.\n');
			return;
		}

		console.log('Updating semester_number values...');
		await updateSemesterNumbers(db);

		console.log('\nVerifying updates...');
		const success = await verifySemesterNumbers(db);

		if (success) {
			console.log('\n✓ Successfully updated all semester_number values.\n');
		} else {
			console.log('\n✗ Some semester_number values could not be updated!\n');
			process.exit(1);
		}
	} finally {
		await closeDatabase(db);
	}
}

run().catch(function handleError(error) {
	console.error('Semester number migration script failed.');
	console.error(error);
	process.exit(1);
});
