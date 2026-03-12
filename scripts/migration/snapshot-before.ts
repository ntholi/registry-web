import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { Pool } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: '.env.local' });

const connectionString =
	process.env.DATABASE_LOCAL_URL ??
	'postgresql://dev:111111@localhost:5432/registry';

interface UserRow {
	id: string;
	name: string | null;
	role: string;
	position: string | null;
	email: string | null;
	email_verified: string | null;
	image: string | null;
	lms_user_id: number | null;
	lms_token: string | null;
}

interface AccountRow {
	user_id: string;
	provider: string;
	provider_account_id: string;
	access_token: string | null;
	refresh_token: string | null;
	expires_at: number | null;
	scope: string | null;
	id_token: string | null;
	token_type: string | null;
	type: string | null;
}

interface DependentRow {
	table: string;
	id: number | string;
	column_value: string;
}

interface Snapshot {
	capturedAt: string;
	users: UserRow[];
	accounts: AccountRow[];
	userCount: number;
	accountCount: number;
	roleDistribution: Record<string, number>;
	positionDistribution: Record<string, number>;
	linkedAccountCount: number;
	providerDistribution: Record<string, number>;
	usersWithLms: number;
	usersWithPosition: number;
	orphanedAccounts: number;
	emailVerifiedDistribution: Record<string, number>;
	dependentEnumValues: DependentRow[];
}

async function captureSnapshot() {
	const pool = new Pool({ connectionString });

	try {
		console.log('Connecting to database...');
		await pool.query('SELECT 1');
		console.log('Connected.\n');

		console.log('=== PRE-MIGRATION SNAPSHOT ===\n');

		const usersResult = await pool.query<UserRow>(
			'SELECT id, name, role, position, email, email_verified::text, image, lms_user_id, lms_token FROM users ORDER BY id'
		);
		console.log(`Users: ${usersResult.rowCount} rows captured`);

		const accountsResult = await pool.query<AccountRow>(
			'SELECT user_id, provider, provider_account_id, access_token, refresh_token, expires_at, scope, id_token, token_type, type FROM accounts ORDER BY user_id, provider'
		);
		console.log(`Accounts: ${accountsResult.rowCount} rows captured`);

		const roleDistResult = await pool.query<{ role: string; count: string }>(
			'SELECT role, count(*)::text FROM users GROUP BY role ORDER BY count(*) DESC'
		);
		const roleDistribution: Record<string, number> = {};
		for (const row of roleDistResult.rows) {
			roleDistribution[row.role] = Number(row.count);
		}
		console.log('Role distribution:', roleDistribution);

		const positionDistResult = await pool.query<{
			position: string;
			count: string;
		}>(
			'SELECT position, count(*)::text FROM users WHERE position IS NOT NULL GROUP BY position ORDER BY count(*) DESC'
		);
		const positionDistribution: Record<string, number> = {};
		for (const row of positionDistResult.rows) {
			positionDistribution[row.position] = Number(row.count);
		}
		console.log('Position distribution:', positionDistribution);

		const linkedResult = await pool.query<{ count: string }>(
			'SELECT count(*)::text FROM accounts a JOIN users u ON a.user_id = u.id'
		);
		const linkedAccountCount = Number(linkedResult.rows[0].count);
		console.log(
			`Linked accounts (account→user FK valid): ${linkedAccountCount}`
		);

		const providerDistResult = await pool.query<{
			provider: string;
			count: string;
		}>(
			'SELECT provider, count(*)::text FROM accounts GROUP BY provider ORDER BY count(*) DESC'
		);
		const providerDistribution: Record<string, number> = {};
		for (const row of providerDistResult.rows) {
			providerDistribution[row.provider] = Number(row.count);
		}
		console.log('Provider distribution:', providerDistribution);

		const lmsResult = await pool.query<{ count: string }>(
			'SELECT count(*)::text FROM users WHERE lms_user_id IS NOT NULL OR lms_token IS NOT NULL'
		);
		const usersWithLms = Number(lmsResult.rows[0].count);
		console.log(`Users with LMS credentials: ${usersWithLms}`);

		const positionCountResult = await pool.query<{ count: string }>(
			'SELECT count(*)::text FROM users WHERE position IS NOT NULL'
		);
		const usersWithPosition = Number(positionCountResult.rows[0].count);
		console.log(`Users with position: ${usersWithPosition}`);

		const orphanResult = await pool.query<{ count: string }>(
			'SELECT count(*)::text FROM accounts a LEFT JOIN users u ON a.user_id = u.id WHERE u.id IS NULL'
		);
		const orphanedAccounts = Number(orphanResult.rows[0].count);
		console.log(`Orphaned accounts (no matching user): ${orphanedAccounts}`);

		const emailVerifiedResult = await pool.query<{
			email_verified: string;
			count: string;
		}>(
			"SELECT COALESCE(email_verified::text, 'NULL') AS email_verified, count(*)::text FROM users GROUP BY email_verified"
		);
		const emailVerifiedDistribution: Record<string, number> = {};
		for (const row of emailVerifiedResult.rows) {
			emailVerifiedDistribution[row.email_verified] = Number(row.count);
		}
		console.log('Email verified distribution:', emailVerifiedDistribution);

		const dependentEnumValues: DependentRow[] = [];

		const clearanceResult = await pool.query<{
			id: number;
			department: string;
		}>('SELECT id, department FROM clearance ORDER BY id');
		for (const row of clearanceResult.rows) {
			dependentEnumValues.push({
				table: 'clearance',
				id: row.id,
				column_value: row.department,
			});
		}
		console.log(
			`Clearance department values: ${clearanceResult.rowCount} rows`
		);

		const autoApprovalsResult = await pool.query<{
			id: number;
			department: string;
		}>('SELECT id, department FROM auto_approvals ORDER BY id');
		for (const row of autoApprovalsResult.rows) {
			dependentEnumValues.push({
				table: 'auto_approvals',
				id: row.id,
				column_value: row.department,
			});
		}
		console.log(
			`Auto approvals department values: ${autoApprovalsResult.rowCount} rows`
		);

		const blockedResult = await pool.query<{
			id: number;
			by_department: string;
		}>('SELECT id, by_department FROM blocked_students ORDER BY id');
		for (const row of blockedResult.rows) {
			dependentEnumValues.push({
				table: 'blocked_students',
				id: row.id,
				column_value: row.by_department,
			});
		}
		console.log(
			`Blocked students by_department values: ${blockedResult.rowCount} rows`
		);

		const notesResult = await pool.query<{
			id: string;
			creator_role: string;
		}>('SELECT id, creator_role FROM student_notes ORDER BY id');
		for (const row of notesResult.rows) {
			dependentEnumValues.push({
				table: 'student_notes',
				id: row.id,
				column_value: row.creator_role,
			});
		}
		console.log(
			`Student notes creator_role values: ${notesResult.rowCount} rows`
		);

		const snapshot: Snapshot = {
			capturedAt: new Date().toISOString(),
			users: usersResult.rows,
			accounts: accountsResult.rows,
			userCount: usersResult.rowCount ?? 0,
			accountCount: accountsResult.rowCount ?? 0,
			roleDistribution,
			positionDistribution,
			linkedAccountCount,
			providerDistribution,
			usersWithLms,
			usersWithPosition,
			orphanedAccounts,
			emailVerifiedDistribution,
			dependentEnumValues,
		};

		const outputPath = resolve(__dirname, 'snapshot-before-migration.json');
		writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
		console.log(`\nSnapshot saved to: ${outputPath}`);

		console.log('\n=== SUMMARY ===');
		console.log(`Total users:    ${snapshot.userCount}`);
		console.log(`Total accounts: ${snapshot.accountCount}`);
		console.log(`Linked:         ${snapshot.linkedAccountCount}`);
		console.log(`Orphaned:       ${snapshot.orphanedAccounts}`);
		console.log(`With LMS:       ${snapshot.usersWithLms}`);
		console.log(`With position:  ${snapshot.usersWithPosition}`);
		console.log(
			`Dependent enum values captured: ${snapshot.dependentEnumValues.length}`
		);
	} finally {
		await pool.end();
	}
}

captureSnapshot().catch((err) => {
	console.error('Snapshot failed:', err);
	process.exit(1);
});
