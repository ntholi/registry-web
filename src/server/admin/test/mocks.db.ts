import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as relations from '../../../db/relations';
import * as schema from '../../../db/schema';

const testConnectionString =
	process.env.DATABASE_TEST_URL ||
	'postgresql://postgres:postgres@localhost:5432/registry_test';

const testPool = new Pool({ connectionString: testConnectionString });

const testDb = drizzle(testPool, {
	schema: { ...schema, ...relations },
	casing: 'snake_case',
});

async function setupTestDatabase() {
	await migrate(testDb, { migrationsFolder: './drizzle' });
}

async function cleanupTestDatabase() {
	await testPool.query(`
		TRUNCATE TABLE
			task_assignments,
			tasks,
			fortinet_registrations,
			documents,
			student_card_prints,
			blocked_students,
			transcript_prints,
			statement_of_results_prints,
			module_grades,
			assessments_audit,
			assessment_marks_audit,
			assessment_marks,
			assessments,
			user_schools,
			assigned_modules,
			sponsored_terms,
			sponsored_students,
			sponsors,
			clearance_audit,
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
}

async function closeTestDatabase() {
	await testPool.end();
}

export { testDb, setupTestDatabase, cleanupTestDatabase, closeTestDatabase };
