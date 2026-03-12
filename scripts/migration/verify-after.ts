import { readFileSync } from 'node:fs';
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

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string) {
	if (condition) {
		passed++;
		console.log(`  ✓ ${message}`);
	} else {
		failed++;
		failures.push(message);
		console.error(`  ✗ FAIL: ${message}`);
	}
}

async function verify() {
	const snapshotPath = resolve(__dirname, 'snapshot-before-migration.json');
	let snapshot: Snapshot;
	try {
		snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'));
	} catch {
		console.error(
			`Cannot read snapshot file at ${snapshotPath}.\nRun snapshot-before.ts BEFORE applying migrations.`
		);
		process.exit(1);
	}

	console.log(`Loaded snapshot from ${snapshot.capturedAt}`);
	console.log(
		`Snapshot has ${snapshot.userCount} users, ${snapshot.accountCount} accounts\n`
	);

	const pool = new Pool({ connectionString });

	try {
		await pool.query('SELECT 1');
		console.log('Connected to database.\n');

		await verifyRowCounts(pool, snapshot);
		await verifyEveryUser(pool, snapshot);
		await verifyEveryAccount(pool, snapshot);
		await verifyAccountUserLinkage(pool, snapshot);
		await verifyRoleDistribution(pool, snapshot);
		await verifyPositionPreservation(pool, snapshot);
		await verifyLmsExtraction(pool, snapshot);
		await verifyEmailVerifiedConversion(pool, snapshot);
		await verifyNoOrphanedAccounts(pool);
		await verifyBetterAuthAccountFields(pool);
		await verifySessionsTable(pool);
		await verifyOldColumnsDropped(pool);
		await verifyEnumTypesDropped(pool);
		await verifyDependentEnumValues(pool, snapshot);
		await verifyProviderDistribution(pool, snapshot);

		console.log('\n========================================');
		console.log(`  PASSED: ${passed}`);
		console.log(`  FAILED: ${failed}`);
		console.log('========================================');

		if (failed > 0) {
			console.error('\nFAILED CHECKS:');
			for (const f of failures) {
				console.error(`  - ${f}`);
			}
			process.exit(1);
		} else {
			console.log('\nALL CHECKS PASSED — data migration verified.');
		}
	} finally {
		await pool.end();
	}
}

async function verifyRowCounts(pool: Pool, snapshot: Snapshot) {
	console.log('--- Row Counts ---');

	const userCount = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM users'
	);
	assert(
		Number(userCount.rows[0].count) === snapshot.userCount,
		`User count: ${userCount.rows[0].count} (expected ${snapshot.userCount})`
	);

	const accountCount = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM accounts'
	);
	assert(
		Number(accountCount.rows[0].count) === snapshot.accountCount,
		`Account count: ${accountCount.rows[0].count} (expected ${snapshot.accountCount})`
	);
}

async function verifyEveryUser(pool: Pool, snapshot: Snapshot) {
	console.log('\n--- Every User Row ---');

	const result = await pool.query<{
		id: string;
		name: string;
		role: string;
		position: string | null;
		email: string;
		email_verified: boolean;
		image: string | null;
	}>(
		'SELECT id, name, role, position, email, email_verified, image FROM users ORDER BY id'
	);

	const postUsers = new Map(result.rows.map((r) => [r.id, r]));

	assert(
		postUsers.size === snapshot.users.length,
		`All ${snapshot.users.length} users exist post-migration (found ${postUsers.size})`
	);

	let missingUsers = 0;
	let nameMismatches = 0;
	let roleMismatches = 0;
	let emailMismatches = 0;
	let positionMismatches = 0;
	let imageMismatches = 0;

	for (const preUser of snapshot.users) {
		const postUser = postUsers.get(preUser.id);
		if (!postUser) {
			missingUsers++;
			if (missingUsers <= 5) {
				console.error(`    Missing user: ${preUser.id} (${preUser.email})`);
			}
			continue;
		}

		const expectedName = preUser.name ?? 'Unknown User';
		if (postUser.name !== expectedName) nameMismatches++;

		if (postUser.role !== preUser.role) roleMismatches++;

		if (postUser.email !== preUser.email) emailMismatches++;

		if (postUser.position !== preUser.position) positionMismatches++;

		if (postUser.image !== preUser.image) imageMismatches++;
	}

	assert(missingUsers === 0, `No missing users (missing: ${missingUsers})`);
	assert(
		nameMismatches === 0,
		`All user names preserved (mismatches: ${nameMismatches})`
	);
	assert(
		roleMismatches === 0,
		`All user roles preserved (mismatches: ${roleMismatches})`
	);
	assert(
		emailMismatches === 0,
		`All user emails preserved (mismatches: ${emailMismatches})`
	);
	assert(
		positionMismatches === 0,
		`All user positions preserved (mismatches: ${positionMismatches})`
	);
	assert(
		imageMismatches === 0,
		`All user images preserved (mismatches: ${imageMismatches})`
	);
}

async function verifyEveryAccount(pool: Pool, snapshot: Snapshot) {
	console.log('\n--- Every Account Row ---');

	const colCheck = await pool.query<{ column_name: string }>(
		"SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'provider_id'"
	);
	if (colCheck.rowCount === 0) {
		assert(
			false,
			'accounts.provider_id column exists — Phase 4/5 migration not yet applied'
		);
		return;
	}

	const result = await pool.query<{
		id: string;
		user_id: string;
		provider_id: string;
		account_id: string;
		access_token: string | null;
		refresh_token: string | null;
		access_token_expires_at: string | null;
		scope: string | null;
		id_token: string | null;
	}>(
		'SELECT id, user_id, provider_id, account_id, access_token, refresh_token, access_token_expires_at, scope, id_token FROM accounts ORDER BY user_id, provider_id'
	);

	const postAccounts = new Map<string, (typeof result.rows)[number]>();
	for (const row of result.rows) {
		postAccounts.set(`${row.user_id}:${row.provider_id}`, row);
	}

	let missingAccounts = 0;
	let providerMismatches = 0;
	let accountIdMismatches = 0;
	let accessTokenMismatches = 0;
	let refreshTokenMismatches = 0;
	let scopeMismatches = 0;
	let idTokenMismatches = 0;
	let expiresAtMismatches = 0;

	for (const preAcct of snapshot.accounts) {
		const key = `${preAcct.user_id}:${preAcct.provider}`;
		const postAcct = postAccounts.get(key);
		if (!postAcct) {
			missingAccounts++;
			if (missingAccounts <= 5) {
				console.error(
					`    Missing account: user=${preAcct.user_id} provider=${preAcct.provider}`
				);
			}
			continue;
		}

		if (postAcct.provider_id !== preAcct.provider) providerMismatches++;
		if (postAcct.account_id !== preAcct.provider_account_id)
			accountIdMismatches++;
		if (postAcct.access_token !== preAcct.access_token) accessTokenMismatches++;
		if (postAcct.refresh_token !== preAcct.refresh_token)
			refreshTokenMismatches++;
		if (postAcct.scope !== preAcct.scope) scopeMismatches++;
		if (postAcct.id_token !== preAcct.id_token) idTokenMismatches++;

		if (preAcct.expires_at !== null) {
			if (postAcct.access_token_expires_at === null) {
				expiresAtMismatches++;
			} else {
				const expectedTs = new Date(preAcct.expires_at * 1000);
				const actualTs = new Date(postAcct.access_token_expires_at);
				if (Math.abs(expectedTs.getTime() - actualTs.getTime()) > 1000) {
					expiresAtMismatches++;
				}
			}
		}
	}

	assert(
		missingAccounts === 0,
		`No missing accounts (missing: ${missingAccounts})`
	);
	assert(
		providerMismatches === 0,
		`provider → provider_id correct (mismatches: ${providerMismatches})`
	);
	assert(
		accountIdMismatches === 0,
		`provider_account_id → account_id correct (mismatches: ${accountIdMismatches})`
	);
	assert(
		accessTokenMismatches === 0,
		`access_token preserved (mismatches: ${accessTokenMismatches})`
	);
	assert(
		refreshTokenMismatches === 0,
		`refresh_token preserved (mismatches: ${refreshTokenMismatches})`
	);
	assert(
		scopeMismatches === 0,
		`scope preserved (mismatches: ${scopeMismatches})`
	);
	assert(
		idTokenMismatches === 0,
		`id_token preserved (mismatches: ${idTokenMismatches})`
	);
	assert(
		expiresAtMismatches === 0,
		`expires_at → access_token_expires_at correct (mismatches: ${expiresAtMismatches})`
	);
}

async function verifyAccountUserLinkage(pool: Pool, snapshot: Snapshot) {
	console.log('\n--- Account-User Linkage ---');

	const result = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM accounts a JOIN users u ON a.user_id = u.id'
	);
	const linked = Number(result.rows[0].count);

	assert(
		linked === snapshot.linkedAccountCount,
		`Linked accounts: ${linked} (expected ${snapshot.linkedAccountCount})`
	);
}

async function verifyRoleDistribution(pool: Pool, snapshot: Snapshot) {
	console.log('\n--- Role Distribution ---');

	const result = await pool.query<{ role: string; count: string }>(
		'SELECT role, count(*)::text FROM users GROUP BY role ORDER BY count(*) DESC'
	);
	const postRoles: Record<string, number> = {};
	for (const row of result.rows) {
		postRoles[row.role] = Number(row.count);
	}

	for (const [role, count] of Object.entries(snapshot.roleDistribution)) {
		const postCount = postRoles[role] ?? 0;
		assert(
			postCount === count,
			`Role '${role}': ${postCount} (expected ${count})`
		);
	}

	for (const [role, count] of Object.entries(postRoles)) {
		if (!(role in snapshot.roleDistribution)) {
			assert(false, `Unexpected new role '${role}' with ${count} users`);
		}
	}
}

async function verifyPositionPreservation(pool: Pool, snapshot: Snapshot) {
	console.log('\n--- Position Preservation ---');

	const result = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM users WHERE position IS NOT NULL'
	);
	const postCount = Number(result.rows[0].count);

	assert(
		postCount === snapshot.usersWithPosition,
		`Users with position: ${postCount} (expected ${snapshot.usersWithPosition})`
	);

	const distResult = await pool.query<{ position: string; count: string }>(
		'SELECT position, count(*)::text FROM users WHERE position IS NOT NULL GROUP BY position'
	);
	const postDist: Record<string, number> = {};
	for (const row of distResult.rows) {
		postDist[row.position] = Number(row.count);
	}

	for (const [pos, count] of Object.entries(snapshot.positionDistribution)) {
		const postPosCount = postDist[pos] ?? 0;
		assert(
			postPosCount === count,
			`Position '${pos}': ${postPosCount} (expected ${count})`
		);
	}
}

async function verifyLmsExtraction(pool: Pool, snapshot: Snapshot) {
	console.log('\n--- LMS Credentials Extraction ---');

	const lmsCredResult = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM lms_credentials'
	);
	const lmsCredCount = Number(lmsCredResult.rows[0].count);

	assert(
		lmsCredCount === snapshot.usersWithLms,
		`LMS credentials rows: ${lmsCredCount} (expected ${snapshot.usersWithLms})`
	);

	if (snapshot.usersWithLms > 0) {
		const usersWithLms = snapshot.users.filter(
			(u) => u.lms_user_id !== null || u.lms_token !== null
		);

		const lmsResult = await pool.query<{
			user_id: string;
			lms_user_id: number | null;
			lms_token: string | null;
		}>('SELECT user_id, lms_user_id, lms_token FROM lms_credentials');

		const lmsMap = new Map(lmsResult.rows.map((r) => [r.user_id, r]));
		let lmsMismatches = 0;

		for (const user of usersWithLms) {
			const cred = lmsMap.get(user.id);
			if (!cred) {
				lmsMismatches++;
				continue;
			}
			if (cred.lms_user_id !== user.lms_user_id) lmsMismatches++;
			if (cred.lms_token !== user.lms_token) lmsMismatches++;
		}

		assert(
			lmsMismatches === 0,
			`LMS values match source (mismatches: ${lmsMismatches})`
		);
	}
}

async function verifyEmailVerifiedConversion(pool: Pool, snapshot: Snapshot) {
	console.log('\n--- email_verified Conversion ---');

	const result = await pool.query<{
		email_verified: boolean;
		count: string;
	}>(
		'SELECT email_verified, count(*)::text FROM users GROUP BY email_verified'
	);

	const postDist: Record<string, number> = {};
	for (const row of result.rows) {
		postDist[String(row.email_verified)] = Number(row.count);
	}

	let expectedTrue = 0;
	let expectedFalse = 0;
	for (const [val, count] of Object.entries(
		snapshot.emailVerifiedDistribution
	)) {
		if (val === 'NULL') {
			expectedFalse += count;
		} else {
			expectedTrue += count;
		}
	}

	const actualTrue = postDist.true ?? 0;
	const actualFalse = postDist.false ?? 0;

	assert(
		actualTrue === expectedTrue,
		`email_verified=true: ${actualTrue} (expected ${expectedTrue})`
	);
	assert(
		actualFalse === expectedFalse,
		`email_verified=false: ${actualFalse} (expected ${expectedFalse})`
	);

	const nullResult = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM users WHERE email_verified IS NULL'
	);
	assert(
		Number(nullResult.rows[0].count) === 0,
		'No NULL email_verified values (all converted)'
	);
}

async function verifyNoOrphanedAccounts(pool: Pool) {
	console.log('\n--- No Orphaned Accounts ---');

	const result = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM accounts a LEFT JOIN users u ON a.user_id = u.id WHERE u.id IS NULL'
	);
	const orphaned = Number(result.rows[0].count);

	assert(orphaned === 0, `No orphaned accounts (found: ${orphaned})`);
}

async function verifyBetterAuthAccountFields(pool: Pool) {
	console.log('\n--- Better Auth Account Fields ---');

	const colCheck = await pool.query<{ column_name: string }>(
		"SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'id'"
	);
	if (colCheck.rowCount === 0) {
		assert(
			false,
			'accounts.id column exists — Phase 4/5 migration not yet applied'
		);
		return;
	}

	const nullIds = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM accounts WHERE id IS NULL'
	);
	assert(Number(nullIds.rows[0].count) === 0, 'All accounts have non-NULL id');

	const nullProviderIds = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM accounts WHERE provider_id IS NULL'
	);
	assert(
		Number(nullProviderIds.rows[0].count) === 0,
		'All accounts have non-NULL provider_id'
	);

	const nullAccountIds = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM accounts WHERE account_id IS NULL'
	);
	assert(
		Number(nullAccountIds.rows[0].count) === 0,
		'All accounts have non-NULL account_id'
	);

	const duplicateIds = await pool.query<{ count: string }>(
		'SELECT (count(*) - count(DISTINCT id))::text AS count FROM accounts'
	);
	assert(
		Number(duplicateIds.rows[0].count) === 0,
		'All account ids are unique'
	);

	const nullTimestamps = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM accounts WHERE created_at IS NULL OR updated_at IS NULL'
	);
	assert(
		Number(nullTimestamps.rows[0].count) === 0,
		'All accounts have created_at and updated_at'
	);
}

async function verifySessionsTable(pool: Pool) {
	console.log('\n--- Sessions Table ---');

	const countResult = await pool.query<{ count: string }>(
		'SELECT count(*)::text FROM sessions'
	);
	assert(
		Number(countResult.rows[0].count) === 0,
		`Sessions table is empty (count: ${countResult.rows[0].count})`
	);

	const columnsResult = await pool.query<{ column_name: string }>(
		"SELECT column_name FROM information_schema.columns WHERE table_name = 'sessions' ORDER BY ordinal_position"
	);
	const columns = columnsResult.rows.map((r) => r.column_name);
	const requiredColumns = [
		'id',
		'token',
		'user_id',
		'expires_at',
		'created_at',
		'updated_at',
		'ip_address',
		'user_agent',
	];
	for (const col of requiredColumns) {
		assert(columns.includes(col), `Sessions has column '${col}'`);
	}
}

async function verifyOldColumnsDropped(pool: Pool) {
	console.log('\n--- Old Columns Dropped ---');

	const oldAccountCols = [
		'type',
		'provider',
		'provider_account_id',
		'expires_at',
		'token_type',
		'session_state',
	];
	const accountColsResult = await pool.query<{ column_name: string }>(
		"SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts'"
	);
	const accountCols = accountColsResult.rows.map((r) => r.column_name);

	for (const col of oldAccountCols) {
		assert(!accountCols.includes(col), `accounts.${col} is dropped`);
	}

	const oldUserCols = ['lms_user_id', 'lms_token'];
	const userColsResult = await pool.query<{ column_name: string }>(
		"SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
	);
	const userCols = userColsResult.rows.map((r) => r.column_name);

	for (const col of oldUserCols) {
		assert(!userCols.includes(col), `users.${col} is dropped`);
	}
}

async function verifyEnumTypesDropped(pool: Pool) {
	console.log('\n--- Enum Types Dropped ---');

	const enumResult = await pool.query<{ typname: string }>(
		"SELECT typname FROM pg_type WHERE typname IN ('user_roles', 'user_positions', 'dashboard_users')"
	);

	assert(
		enumResult.rowCount === 0,
		`All 3 enum types dropped (remaining: ${enumResult.rows.map((r) => r.typname).join(', ') || 'none'})`
	);
}

async function verifyDependentEnumValues(pool: Pool, snapshot: Snapshot) {
	console.log('\n--- Dependent Enum→Text Values ---');

	const clearanceRows = snapshot.dependentEnumValues.filter(
		(r) => r.table === 'clearance'
	);
	if (clearanceRows.length > 0) {
		const result = await pool.query<{ id: number; department: string }>(
			'SELECT id, department FROM clearance ORDER BY id'
		);
		const postMap = new Map(result.rows.map((r) => [r.id, r.department]));
		let mismatches = 0;
		for (const row of clearanceRows) {
			if (postMap.get(row.id as number) !== row.column_value) mismatches++;
		}
		assert(
			mismatches === 0,
			`clearance.department values preserved (${clearanceRows.length} rows, mismatches: ${mismatches})`
		);
	}

	const autoApprovalRows = snapshot.dependentEnumValues.filter(
		(r) => r.table === 'auto_approvals'
	);
	if (autoApprovalRows.length > 0) {
		const result = await pool.query<{ id: number; department: string }>(
			'SELECT id, department FROM auto_approvals ORDER BY id'
		);
		const postMap = new Map(result.rows.map((r) => [r.id, r.department]));
		let mismatches = 0;
		for (const row of autoApprovalRows) {
			if (postMap.get(row.id as number) !== row.column_value) mismatches++;
		}
		assert(
			mismatches === 0,
			`auto_approvals.department values preserved (${autoApprovalRows.length} rows, mismatches: ${mismatches})`
		);
	}

	const blockedRows = snapshot.dependentEnumValues.filter(
		(r) => r.table === 'blocked_students'
	);
	if (blockedRows.length > 0) {
		const result = await pool.query<{ id: number; by_department: string }>(
			'SELECT id, by_department FROM blocked_students ORDER BY id'
		);
		const postMap = new Map(result.rows.map((r) => [r.id, r.by_department]));
		let mismatches = 0;
		for (const row of blockedRows) {
			if (postMap.get(row.id as number) !== row.column_value) mismatches++;
		}
		assert(
			mismatches === 0,
			`blocked_students.by_department values preserved (${blockedRows.length} rows, mismatches: ${mismatches})`
		);
	}

	const noteRows = snapshot.dependentEnumValues.filter(
		(r) => r.table === 'student_notes'
	);
	if (noteRows.length > 0) {
		const result = await pool.query<{ id: string; creator_role: string }>(
			'SELECT id, creator_role FROM student_notes ORDER BY id'
		);
		const postMap = new Map(result.rows.map((r) => [r.id, r.creator_role]));
		let mismatches = 0;
		for (const row of noteRows) {
			if (postMap.get(row.id as string) !== row.column_value) mismatches++;
		}
		assert(
			mismatches === 0,
			`student_notes.creator_role values preserved (${noteRows.length} rows, mismatches: ${mismatches})`
		);
	}
}

async function verifyProviderDistribution(pool: Pool, snapshot: Snapshot) {
	console.log('\n--- Provider Distribution ---');

	const colCheck = await pool.query<{ column_name: string }>(
		"SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'provider_id'"
	);
	if (colCheck.rowCount === 0) {
		assert(
			false,
			'accounts.provider_id column exists — Phase 4/5 migration not yet applied'
		);
		return;
	}

	const result = await pool.query<{ provider_id: string; count: string }>(
		'SELECT provider_id, count(*)::text FROM accounts GROUP BY provider_id ORDER BY count(*) DESC'
	);
	const postDist: Record<string, number> = {};
	for (const row of result.rows) {
		postDist[row.provider_id] = Number(row.count);
	}

	for (const [provider, count] of Object.entries(
		snapshot.providerDistribution
	)) {
		const postCount = postDist[provider] ?? 0;
		assert(
			postCount === count,
			`Provider '${provider}': ${postCount} (expected ${count})`
		);
	}
}

verify().catch((err) => {
	console.error('Verification failed:', err);
	process.exit(1);
});
