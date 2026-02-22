import * as academic from '@academic/_database';
import * as admin from '@admin/_database';
import * as auth from '@auth/_database';
import * as finance from '@finance/_database';
import * as registry from '@registry/_database';
import * as timetable from '@timetable/_database';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const schema = {
	...academic,
	...admin,
	...auth,
	...finance,
	...registry,
	...timetable,
};

const testConnectionString =
	process.env.DATABASE_TEST_URL ||
	'postgresql://postgres:postgres@localhost:5432/registry_test';

const testPool = new Pool({ connectionString: testConnectionString });

const testDb = drizzle(testPool, {
	schema,
	casing: 'snake_case',
});

async function setupTestDatabase() {
	await resetPublicSchema();
	await migrate(testDb, { migrationsFolder: './drizzle' });
	const result = await testPool.query(
		"select to_regclass('public.sponsors') as table_name"
	);
	if (!result.rows[0]?.table_name) {
		throw new Error('Sponsors table missing after migrations');
	}
}

async function resetPublicSchema() {
	await testPool.query('DROP SCHEMA IF EXISTS public CASCADE');
	await testPool.query('CREATE SCHEMA public');
	await testPool.query('GRANT ALL ON SCHEMA public TO postgres');
	await testPool.query('GRANT ALL ON SCHEMA public TO public');
	await testPool.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
	await testPool.query('CREATE SCHEMA drizzle');
}

async function cleanupTestDatabase() {
	try {
		await testPool.query(`
			TRUNCATE TABLE
				fortinet_registrations,
				documents,
				student_card_prints,
				blocked_students,
				transcript_prints,
				statement_of_results_prints,
				module_grades,
				assessment_marks,
				assessments,
				timetable_slot_allocations,
				timetable_slots,
				user_schools,
				assigned_modules,
				sponsored_terms,
				sponsored_students,
				sponsors,
				payment_receipts,
				graduation_clearance,
				graduation_requests,
				registration_clearance,
				clearance,
				requested_modules,
				registration_requests,
				terms,
				module_prerequisites,
				semester_modules,
				modules,
				structure_semesters,
				structures,
				programs,
				schools,
				student_modules,
				student_semesters,
				student_programs,
				next_of_kins,
				student_education,
				students,
				authenticators,
				sessions,
				accounts,
				verification_tokens,
				users
			RESTART IDENTITY CASCADE
		`);
	} catch (error) {
		const code =
			error instanceof Error
				? ((error as { code?: string; cause?: { code?: string } }).code ??
					(error as { code?: string; cause?: { code?: string } }).cause?.code)
				: undefined;
		if (code === '42P01') {
			await setupTestDatabase();
			return;
		}
		throw error;
	}
}

async function closeTestDatabase() {
	await testPool.end();
}

export { testDb, setupTestDatabase, cleanupTestDatabase, closeTestDatabase };
