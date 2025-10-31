import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as readline from 'node:readline/promises';
import Database from 'better-sqlite3';
import { config } from 'dotenv';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as sqliteSchema from '../src/db/old.schema';
import * as postgresSchema from '../src/db/schema';
import {
	assessmentMarksAuditAction,
	assessmentNumber,
	assessmentsAuditAction,
	blockedStudentStatusEnum,
	clearanceRequestStatus,
	dashboardUsers,
	fortinetLevel,
	fortinetRegistrationStatus,
	gender,
	grade,
	graduationListStatusEnum,
	maritalStatusEnum,
	moduleStatusEnum,
	moduleType,
	paymentType,
	programLevelEnum,
	programStatus,
	registrationRequestStatus,
	requestedModuleStatus,
	semesterStatus,
	semesterStatusForRegistration,
	signupStatus,
	studentModuleStatus,
	taskPriority,
	taskStatus,
	userPositions,
	userRoles,
} from '../src/db/schema';

config({ path: '.env.local' });

const databaseEnv = process.env.DATABASE_ENV || 'local';
process.env.DATABASE_URL =
	databaseEnv === 'remote' ? process.env.DATABASE_REMOTE_URL! : process.env.DATABASE_LOCAL_URL!;

type SqliteSelect<TTable> = TTable extends { $inferSelect: infer TRow } ? TRow : never;
type PostgresInsert<TTable> = TTable extends { $inferInsert: infer TRow } ? TRow : never;

type MigrationPlan<STable, PTable> = {
	readonly name: string;
	readonly sqliteTable: STable;
	readonly postgresTable: PTable;
	readonly map: (row: SqliteSelect<STable>) => PostgresInsert<PTable>;
};

type Mode = 'migrate' | 'verify' | 'migrate-and-verify';

type VerificationResult = {
	readonly table: string;
	readonly passed: boolean;
	readonly sqliteCount: number;
	readonly postgresCount: number;
	readonly countMatches: boolean;
	readonly rowMismatches: ReadonlyArray<DetailedRowMismatch>;
	readonly missingInPostgres: ReadonlyArray<Record<string, unknown>>;
	readonly extraInPostgres: ReadonlyArray<Record<string, unknown>>;
	readonly fieldMismatches: ReadonlyArray<FieldMismatch>;
	readonly referentialIntegrityIssues: ReadonlyArray<string>;
};

type DetailedRowMismatch = {
	readonly identifier: Record<string, unknown>;
	readonly sqliteRow: Record<string, unknown>;
	readonly postgresRow: Record<string, unknown>;
	readonly differentFields: ReadonlyArray<FieldDifference>;
};

type FieldMismatch = {
	readonly field: string;
	readonly sqliteValue: unknown;
	readonly postgresValue: unknown;
	readonly sqliteType: string;
	readonly postgresType: string;
	readonly identifier: Record<string, unknown>;
};

type FieldDifference = {
	readonly field: string;
	readonly sqliteValue: unknown;
	readonly postgresValue: unknown;
	readonly sqliteType: string;
	readonly postgresType: string;
};

const BATCH_SIZE = 200;
const MAX_MISMATCHES_TO_SHOW = 20;

let cachedStudentSemesterIds: Set<number> | null = null;
let cachedStudentModulesExpectedCount: number | null = null;

type EnumMapping = {
	invalidValue: string;
	validValue: string;
	applyToAll: boolean;
};

type EnumMappings = Map<string, Map<string, EnumMapping>>;

const enumMappings: EnumMappings = new Map();

function loadEnumMappingsFromFile(): void {
	try {
		const mappingsPath = join(__dirname, 'enum-mappings.json');
		const fileContent = readFileSync(mappingsPath, 'utf-8');
		const mappingsData = JSON.parse(fileContent) as Record<
			string,
			Record<string, Record<string, string>>
		>;

		let totalMappings = 0;
		for (const [tableName, fields] of Object.entries(mappingsData)) {
			for (const [fieldName, mappings] of Object.entries(fields)) {
				const tableKey = `${tableName}.${fieldName}`;
				const fieldMappings = new Map<string, EnumMapping>();

				for (const [invalidValue, validValue] of Object.entries(mappings)) {
					fieldMappings.set(invalidValue, {
						invalidValue,
						validValue,
						applyToAll: true,
					});
					totalMappings++;
				}

				enumMappings.set(tableKey, fieldMappings);
			}
		}

		console.log(`✓ Loaded ${totalMappings} enum mappings from enum-mappings.json\n`);
	} catch (_error) {
		console.log('ℹ No existing enum-mappings.json found, starting fresh\n');
	}
}

const POSTGRES_ENUMS: Record<string, readonly string[]> = {
	module_type: [...moduleType.enumValues],
	user_roles: [...userRoles.enumValues],
	user_positions: [...userPositions.enumValues],
	signup_status: [...signupStatus.enumValues],
	gender: [...gender.enumValues],
	marital_status: [...maritalStatusEnum.enumValues],
	program_status: [...programStatus.enumValues],
	semester_status: [...semesterStatus.enumValues],
	student_module_status: [...studentModuleStatus.enumValues],
	grade: [...grade.enumValues],
	program_level: [...programLevelEnum.enumValues],
	module_status: [...moduleStatusEnum.enumValues],
	registration_request_status: [...registrationRequestStatus.enumValues],
	semester_status_for_registration: [...semesterStatusForRegistration.enumValues],
	requested_module_status: [...requestedModuleStatus.enumValues],
	clearance_request_status: [...clearanceRequestStatus.enumValues],
	graduation_list_status: [...graduationListStatusEnum.enumValues],
	payment_type: [...paymentType.enumValues],
	assessment_number: [...assessmentNumber.enumValues],
	assessment_marks_audit_action: [...assessmentMarksAuditAction.enumValues],
	assessments_audit_action: [...assessmentsAuditAction.enumValues],
	blocked_student_status: [...blockedStudentStatusEnum.enumValues],
	fortinet_level: [...fortinetLevel.enumValues],
	fortinet_registration_status: [...fortinetRegistrationStatus.enumValues],
	task_status: [...taskStatus.enumValues],
	task_priority: [...taskPriority.enumValues],
	dashboard_users: [...dashboardUsers.enumValues],
};

const _FIELD_TO_ENUM_MAP: Record<string, string> = {
	type: 'module_type',
	role: 'user_roles',
	position: 'user_positions',
	status: 'signup_status',
	gender: 'gender',
	maritalStatus: 'marital_status',
	programStatus: 'program_status',
	semesterStatus: 'semester_status',
	moduleStatus: 'student_module_status',
	grade: 'grade',
	level: 'program_level',
	moduleStatusField: 'module_status',
	registrationStatus: 'registration_request_status',
	semesterStatusForRegistration: 'semester_status_for_registration',
	requestedModuleStatus: 'requested_module_status',
	clearanceStatus: 'clearance_request_status',
	graduationListStatus: 'graduation_list_status',
	paymentType: 'payment_type',
	assessmentNumber: 'assessment_number',
	action: 'assessment_marks_audit_action',
};

function assertEnvironment(): void {
	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set in the environment.');
	}
}

function cleanupSqliteDatabase(): void {
	console.log('🧹 Cleaning up SQLite database...\n');
	const database = new Database('local.db');

	try {
		const updates = [
			// student_modules.grade updates
			{ table: 'student_modules', column: 'grade', from: 'Def', to: 'DEF' },
			{ table: 'student_modules', column: 'grade', from: 'DFR', to: 'F' },
			{ table: 'student_modules', column: 'grade', from: ' B', to: 'B' },
			{ table: 'student_modules', column: 'grade', from: 'W', to: 'F' },
			{ table: 'student_modules', column: 'grade', from: 'P', to: 'C-' },
			{ table: 'student_modules', column: 'grade', from: 'b', to: 'B' },
			{ table: 'student_modules', column: 'grade', from: 'PX ', to: 'PX' },
			{ table: 'student_modules', column: 'grade', from: 'f', to: 'F' },
			{ table: 'student_modules', column: 'grade', from: 'b-', to: 'B-' },
			{ table: 'student_modules', column: 'grade', from: 'C+.', to: 'C+' },
			{ table: 'student_modules', column: 'grade', from: 'c+', to: 'C+' },
			{ table: 'student_modules', column: 'grade', from: '50', to: 'C-' },
			{ table: 'student_modules', column: 'grade', from: 'A-   ', to: 'A-' },
			// module_grades.grade updates
			{ table: 'module_grades', column: 'grade', from: 'Def', to: 'DEF' },
			{ table: 'module_grades', column: 'grade', from: 'DFR', to: 'F' },
			{ table: 'module_grades', column: 'grade', from: ' B', to: 'B' },
			{ table: 'module_grades', column: 'grade', from: 'W', to: 'F' },
			{ table: 'module_grades', column: 'grade', from: 'P', to: 'C-' },
			{ table: 'module_grades', column: 'grade', from: 'b', to: 'B' },
			{ table: 'module_grades', column: 'grade', from: 'PX ', to: 'PX' },
			{ table: 'module_grades', column: 'grade', from: 'f', to: 'F' },
			{ table: 'module_grades', column: 'grade', from: 'b-', to: 'B-' },
			{ table: 'module_grades', column: 'grade', from: 'C+.', to: 'C+' },
			{ table: 'module_grades', column: 'grade', from: 'c+', to: 'C+' },
			{ table: 'module_grades', column: 'grade', from: '50', to: 'C-' },
			{ table: 'module_grades', column: 'grade', from: 'A-   ', to: 'A-' },
		];

		for (const update of updates) {
			const stmt = database.prepare(
				`UPDATE ${update.table} SET ${update.column} = ? WHERE ${update.column} = ?`
			);
			const result = stmt.run(update.to, update.from);
			if (result.changes > 0) {
				console.log(
					`  ✓ Updated ${result.changes} rows: ${update.table}.${update.column} '${update.from}' → '${update.to}'`
				);
			}
		}

		console.log('\n✓ SQLite database cleanup complete\n');
	} finally {
		database.close();
	}
}

function openSqliteDatabase(): ReturnType<typeof drizzleSqlite<typeof sqliteSchema>> {
	const database = new Database('local.db', { readonly: true });
	return drizzleSqlite(database, {
		schema: sqliteSchema,
		casing: 'snake_case',
	});
}

function getStudentSemesterIds(
	sqliteDb: ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>
): Set<number> {
	if (cachedStudentSemesterIds) {
		return cachedStudentSemesterIds;
	}
	const rows = sqliteDb
		.select({ id: sqliteSchema.studentSemesters.id })
		.from(sqliteSchema.studentSemesters)
		.all();
	cachedStudentSemesterIds = new Set(
		rows.map(function mapId(row) {
			return row.id;
		})
	);
	return cachedStudentSemesterIds;
}

function _getStudentModulesExpectedCount(
	sqliteDb: ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>
): number {
	if (cachedStudentModulesExpectedCount !== null) {
		return cachedStudentModulesExpectedCount;
	}
	const row = sqliteDb.$client
		.prepare(
			'select count(*) as count from student_modules where student_semester_id in (select id from student_semesters)'
		)
		.get() as { readonly count?: number } | undefined;
	const count = row && typeof row.count === 'number' ? row.count : 0;
	cachedStudentModulesExpectedCount = count;
	return count;
}

async function openPostgresDatabase(): Promise<
	ReturnType<typeof drizzlePostgres<typeof postgresSchema>>
> {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	return drizzlePostgres(pool, {
		schema: postgresSchema,
		casing: 'snake_case',
	});
}

function closeSqliteDatabase(
	instance: ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>
): void {
	instance.$client.close();
}

async function closePostgresDatabase(
	instance: ReturnType<typeof drizzlePostgres<typeof postgresSchema>>
): Promise<void> {
	await instance.$client.end();
}

function toBoolean(value: unknown): boolean {
	const normalised = toOptionalBoolean(value);
	if (normalised === null) {
		throw new Error('Encountered null while converting to boolean.');
	}
	return normalised;
}

function toOptionalBoolean(value: unknown): boolean | null {
	if (value === null || value === undefined) {
		return null;
	}
	if (typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'number') {
		if (value === 1) {
			return true;
		}
		if (value === 0) {
			return false;
		}
	}
	if (typeof value === 'string') {
		const lower = value.toLowerCase();
		if (lower === '1' || lower === 'true') {
			return true;
		}
		if (lower === '0' || lower === 'false') {
			return false;
		}
	}
	throw new Error(`Unable to convert value "${String(value)}" to boolean.`);
}

function toOptionalDateFromSeconds(value: unknown): Date | null {
	if (value === null || value === undefined) {
		return null;
	}
	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) {
			return null;
		}
		return value;
	}
	if (typeof value === 'number') {
		const date = new Date(value * 1000);
		if (Number.isNaN(date.getTime())) {
			return null;
		}
		return date;
	}
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (trimmed.length === 0) {
			return null;
		}
		const numeric = Number.parseInt(trimmed, 10);
		if (!Number.isNaN(numeric)) {
			const numericDate = new Date(numeric * 1000);
			if (!Number.isNaN(numericDate.getTime())) {
				return numericDate;
			}
		}
		const asDate = Date.parse(trimmed);
		if (!Number.isNaN(asDate)) {
			const parsedDate = new Date(asDate);
			if (Number.isNaN(parsedDate.getTime())) {
				return null;
			}
			return parsedDate;
		}
	}
	throw new Error(`Unable to convert value "${String(value)}" (seconds) to Date.`);
}

function toOptionalDateFromMilliseconds(value: unknown): Date | null {
	if (value === null || value === undefined) {
		return null;
	}
	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) {
			return null;
		}
		return value;
	}
	if (typeof value === 'number') {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return null;
		}
		return date;
	}
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (trimmed.length === 0) {
			return null;
		}
		const parsed = Number.parseInt(trimmed, 10);
		if (!Number.isNaN(parsed)) {
			const numericDate = new Date(parsed);
			if (Number.isNaN(numericDate.getTime())) {
				return null;
			}
			return numericDate;
		}
		const asDate = Date.parse(trimmed);
		if (!Number.isNaN(asDate)) {
			const parsedDate = new Date(asDate);
			if (Number.isNaN(parsedDate.getTime())) {
				return null;
			}
			return parsedDate;
		}
	}
	throw new Error(`Unable to convert value "${String(value)}" (milliseconds) to Date.`);
}

function parseJsonArray(value: unknown): string[] {
	if (value === null || value === undefined) {
		return [];
	}
	if (Array.isArray(value)) {
		return value as string[];
	}
	if (typeof value === 'string') {
		const parsed = JSON.parse(value);
		if (Array.isArray(parsed)) {
			return parsed as string[];
		}
	}
	throw new Error(`Unable to convert value "${String(value)}" to JSON array.`);
}

function chunkArray<TItem>(items: ReadonlyArray<TItem>, size: number): TItem[][] {
	if (size <= 0) {
		throw new Error('Chunk size must be greater than zero.');
	}
	const result: TItem[][] = [];
	for (let index = 0; index < items.length; index += size) {
		result.push(items.slice(index, Math.min(index + size, items.length)));
	}
	return result;
}

function normaliseValue(value: unknown): unknown {
	if (value === null || value === undefined) {
		return null;
	}
	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) {
			return null;
		}
		return value.toISOString();
	}
	if (value instanceof Uint8Array) {
		if (value.length === 0) {
			return '';
		}
		return Buffer.from(value).toString('base64');
	}
	if (Array.isArray(value)) {
		return value.map(function mapArrayEntry(entry) {
			return normaliseValue(entry);
		});
	}
	if (typeof value === 'object') {
		const record = value as Record<string, unknown>;
		const keys = Object.keys(record).sort();
		const normalised: Record<string, unknown> = {};
		for (const key of keys) {
			normalised[key] = normaliseValue(record[key]);
		}
		return normalised;
	}
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) {
			return String(value);
		}
		if (Number.isInteger(value)) {
			return value;
		}
		const float32 = new Float32Array([value]);
		return float32[0];
	}
	return value;
}

function normaliseForPostgres(value: unknown): unknown {
	if (value === null || value === undefined) {
		return null;
	}
	if (value instanceof Date) {
		return value;
	}
	if (value instanceof Uint8Array) {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map(function mapArrayEntry(entry) {
			return normaliseForPostgres(entry);
		});
	}
	if (typeof value === 'object') {
		const record = value as Record<string, unknown>;
		const normalised: Record<string, unknown> = {};
		for (const key of Object.keys(record)) {
			normalised[key] = normaliseForPostgres(record[key]);
		}
		return normalised;
	}
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) {
			return value;
		}
		if (Number.isInteger(value)) {
			return value;
		}
		const float32 = new Float32Array([value]);
		return float32[0];
	}
	return value;
}

function serialiseRow(row: Record<string, unknown>): string {
	const keys = Object.keys(row).sort();
	const ordered: Record<string, unknown> = {};
	for (const key of keys) {
		ordered[key] = normaliseValue(row[key]);
	}
	return JSON.stringify(ordered);
}

function _deserialiseRow(serialised: string): Record<string, unknown> {
	return JSON.parse(serialised) as Record<string, unknown>;
}

function getTypeOf(value: unknown): string {
	if (value === null || value === undefined) {
		return 'null';
	}
	if (value instanceof Date) {
		return 'Date';
	}
	if (value instanceof Uint8Array) {
		return 'Uint8Array';
	}
	if (Array.isArray(value)) {
		return 'Array';
	}
	return typeof value;
}

function getRowIdentifier<STable>(
	row: SqliteSelect<STable>,
	_plan: MigrationPlan<STable, unknown>
): Record<string, unknown> {
	const rowObj = row as unknown as Record<string, unknown>;
	if ('id' in rowObj) {
		return { id: rowObj.id };
	}
	if ('stdNo' in rowObj) {
		return { stdNo: rowObj.stdNo };
	}
	if ('sessionToken' in rowObj) {
		return { sessionToken: rowObj.sessionToken };
	}
	if ('credentialID' in rowObj) {
		return { credentialID: rowObj.credentialID };
	}
	if ('userId' in rowObj && 'name' in rowObj) {
		return { userId: rowObj.userId };
	}
	if ('provider' in rowObj && 'providerAccountId' in rowObj) {
		return {
			provider: rowObj.provider,
			providerAccountId: rowObj.providerAccountId,
		};
	}
	if ('identifier' in rowObj && 'token' in rowObj) {
		return { identifier: rowObj.identifier, token: rowObj.token };
	}
	return { _allFields: rowObj };
}

function getEnumNameFromField(fieldName: string, tableName: string): string | null {
	if (tableName === 'semester_modules' && fieldName === 'type') {
		return 'module_type';
	}
	if (tableName === 'users' && fieldName === 'role') {
		return 'user_roles';
	}
	if (tableName === 'users' && fieldName === 'position') {
		return 'user_positions';
	}
	if (tableName === 'signups' && fieldName === 'status') {
		return 'signup_status';
	}
	if (tableName === 'students' && fieldName === 'gender') {
		return 'gender';
	}
	if (tableName === 'students' && fieldName === 'maritalStatus') {
		return 'marital_status';
	}
	if (tableName === 'student_programs' && fieldName === 'status') {
		return 'program_status';
	}
	if (tableName === 'student_semesters' && fieldName === 'status') {
		return 'semester_status';
	}
	if (tableName === 'student_modules' && fieldName === 'status') {
		return 'student_module_status';
	}
	if (tableName === 'student_modules' && fieldName === 'grade') {
		return 'grade';
	}
	if (tableName === 'programs' && fieldName === 'level') {
		return 'program_level';
	}
	if (tableName === 'modules' && fieldName === 'status') {
		return 'module_status';
	}
	if (tableName === 'registration_requests' && fieldName === 'status') {
		return 'registration_request_status';
	}
	if (tableName === 'registration_requests' && fieldName === 'semesterStatus') {
		return 'semester_status_for_registration';
	}
	if (tableName === 'requested_modules' && fieldName === 'status') {
		return 'requested_module_status';
	}
	if (tableName === 'requested_modules' && fieldName === 'moduleStatus') {
		return 'student_module_status';
	}
	if (tableName === 'clearance' && fieldName === 'status') {
		return 'clearance_request_status';
	}
	if (tableName === 'graduation_lists' && fieldName === 'status') {
		return 'graduation_list_status';
	}
	if (tableName === 'payment_receipts' && fieldName === 'paymentType') {
		return 'payment_type';
	}
	if (tableName === 'assessments' && fieldName === 'assessmentNumber') {
		return 'assessment_number';
	}
	if (tableName === 'assessment_marks_audit' && fieldName === 'action') {
		return 'assessment_marks_audit_action';
	}
	if (tableName === 'assessments_audit' && fieldName === 'action') {
		return 'assessments_audit_action';
	}
	if (
		tableName === 'assessments_audit' &&
		(fieldName === 'previousAssessmentNumber' || fieldName === 'newAssessmentNumber')
	) {
		return 'assessment_number';
	}
	if (tableName === 'blocked_students' && fieldName === 'status') {
		return 'blocked_student_status';
	}
	if (tableName === 'blocked_students' && fieldName === 'byDepartment') {
		return 'dashboard_users';
	}
	if (tableName === 'clearance' && fieldName === 'department') {
		return 'dashboard_users';
	}
	if (tableName === 'fortinet_registrations' && fieldName === 'level') {
		return 'fortinet_level';
	}
	if (tableName === 'fortinet_registrations' && fieldName === 'status') {
		return 'fortinet_registration_status';
	}
	if (tableName === 'tasks' && fieldName === 'status') {
		return 'task_status';
	}
	if (tableName === 'tasks' && fieldName === 'priority') {
		return 'task_priority';
	}
	if (tableName === 'tasks' && fieldName === 'department') {
		return 'dashboard_users';
	}
	if (
		tableName === 'clearance_audit' &&
		(fieldName === 'previousStatus' || fieldName === 'newStatus')
	) {
		return 'registration_request_status';
	}
	return null;
}

function isValidEnumValue(enumName: string, value: unknown): boolean {
	if (value === null || value === undefined) {
		return true;
	}
	const validValues = POSTGRES_ENUMS[enumName];
	if (!validValues) {
		return true;
	}
	return validValues.includes(String(value));
}

async function promptForEnumValue(
	tableName: string,
	fieldName: string,
	enumName: string,
	invalidValue: string,
	rowIdentifier: Record<string, unknown>
): Promise<EnumMapping | null> {
	const tableKey = `${tableName}.${fieldName}`;
	const existingMapping = enumMappings.get(tableKey)?.get(invalidValue);
	if (existingMapping) {
		return existingMapping;
	}

	const validValues = POSTGRES_ENUMS[enumName];
	if (!validValues) {
		console.error(`Unknown enum: ${enumName}`);
		return null;
	}

	console.log(`\n${'='.repeat(80)}`);
	console.log(`❌ Invalid enum value detected:`);
	console.log(`   Table: ${tableName}`);
	console.log(`   Field: ${fieldName}`);
	console.log(`   Invalid value: "${invalidValue}"`);
	console.log(`   Row identifier:`, JSON.stringify(rowIdentifier));
	console.log(`\nValid options for ${enumName}:`);
	validValues.forEach((v, i) => {
		console.log(`   ${i + 1}. ${v}`);
	});

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	let rl2: readline.Interface | null = null;

	try {
		const answer = await rl.question('\nSelect a valid option (number) or press Enter to skip: ');

		rl.close();

		if (!answer.trim()) {
			console.log('⚠️  Skipping this row...\n');
			return null;
		}

		const selectedIndex = parseInt(answer.trim(), 10) - 1;
		if (selectedIndex < 0 || selectedIndex >= validValues.length) {
			console.log('❌ Invalid selection. Skipping this row...\n');
			return null;
		}

		const validValue = validValues[selectedIndex];

		rl2 = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		const applyToAllAnswer = await rl2.question(
			`\nApply "${validValue}" to ALL occurrences of "${invalidValue}" in ${tableName}.${fieldName}? (y/n): `
		);

		rl2.close();

		const applyToAll = applyToAllAnswer.trim().toLowerCase() === 'y';

		const mapping: EnumMapping = {
			invalidValue,
			validValue,
			applyToAll,
		};

		if (applyToAll) {
			if (!enumMappings.has(tableKey)) {
				enumMappings.set(tableKey, new Map());
			}
			enumMappings.get(tableKey)!.set(invalidValue, mapping);
			console.log(`✓ Will apply "${validValue}" to all future occurrences of "${invalidValue}"\n`);
		} else {
			console.log(`✓ Applied "${validValue}" to this row only\n`);
		}

		return mapping;
	} catch (error) {
		try {
			rl.close();
		} catch {
			/* ignore */
		}
		try {
			if (rl2) {
				rl2.close();
			}
		} catch {
			/* ignore */
		}
		throw error;
	}
}

function applyEnumMapping(
	row: Record<string, unknown>,
	tableName: string
): Record<string, unknown> {
	const result = { ...row };

	for (const [fieldName, value] of Object.entries(result)) {
		if (value === null || value === undefined) {
			continue;
		}

		const enumName = getEnumNameFromField(fieldName, tableName);
		if (!enumName) {
			continue;
		}

		const tableKey = `${tableName}.${fieldName}`;
		const mapping = enumMappings.get(tableKey)?.get(String(value));

		if (mapping) {
			result[fieldName] = mapping.validValue;
		}
	}

	return result;
}

async function validateAndFixEnumValues(
	row: Record<string, unknown>,
	tableName: string,
	rowIdentifier: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
	const result = { ...row };

	for (const [fieldName, value] of Object.entries(result)) {
		if (value === null || value === undefined) {
			continue;
		}

		const enumName = getEnumNameFromField(fieldName, tableName);
		if (!enumName) {
			continue;
		}

		if (!isValidEnumValue(enumName, value)) {
			const tableKey = `${tableName}.${fieldName}`;
			const existingMapping = enumMappings.get(tableKey)?.get(String(value));

			if (existingMapping) {
				result[fieldName] = existingMapping.validValue;
				continue;
			}

			const mapping = await promptForEnumValue(
				tableName,
				fieldName,
				enumName,
				String(value),
				rowIdentifier
			);

			if (!mapping) {
				console.log(`⚠️  Skipping row due to invalid enum value`);
				return null;
			}

			result[fieldName] = mapping.validValue;
		}
	}

	return result;
}

function compareValues(sqliteValue: unknown, postgresValue: unknown): boolean {
	const normalizedSqlite = normaliseValue(sqliteValue);
	const normalizedPostgres = normaliseValue(postgresValue);

	if (normalizedSqlite === null && normalizedPostgres === null) {
		return true;
	}

	if (normalizedSqlite === null || normalizedPostgres === null) {
		return false;
	}

	const sqliteType = getTypeOf(normalizedSqlite);
	const postgresType = getTypeOf(normalizedPostgres);

	if (sqliteType === 'Date' && postgresType === 'string') {
		return true;
	}

	if (sqliteType === 'number' && postgresType === 'number') {
		const s = normalizedSqlite as number;
		const p = normalizedPostgres as number;
		if (Math.abs(s - p) < 0.0001) {
			return true;
		}
	}

	return JSON.stringify(normalizedSqlite) === JSON.stringify(normalizedPostgres);
}

function compareRows(
	sqliteRow: Record<string, unknown>,
	postgresRow: Record<string, unknown>
): ReadonlyArray<FieldDifference> {
	const differences: FieldDifference[] = [];
	const allKeys = new Set<string>();

	for (const key of Object.keys(sqliteRow)) {
		allKeys.add(key);
	}
	for (const key of Object.keys(postgresRow)) {
		allKeys.add(key);
	}

	for (const key of allKeys) {
		const sqliteValue = sqliteRow[key];
		const postgresValue = postgresRow[key];

		if (!compareValues(sqliteValue, postgresValue)) {
			differences.push({
				field: key,
				sqliteValue,
				postgresValue,
				sqliteType: getTypeOf(sqliteValue),
				postgresType: getTypeOf(postgresValue),
			});
		}
	}

	return differences;
}

function createRowKey(row: Record<string, unknown>): string {
	return serialiseRow(row);
}

function mapUsers(
	row: SqliteSelect<typeof sqliteSchema.users>
): PostgresInsert<typeof postgresSchema.users> {
	return {
		id: row.id,
		name: row.name,
		role: row.role,
		position: row.position,
		email: row.email,
		emailVerified: toOptionalDateFromMilliseconds(row.emailVerified),
		image: row.image,
	};
}

function mapAccounts(
	row: SqliteSelect<typeof sqliteSchema.accounts>
): PostgresInsert<typeof postgresSchema.accounts> {
	return {
		userId: row.userId,
		type: row.type,
		provider: row.provider,
		providerAccountId: row.providerAccountId,
		refresh_token: row.refresh_token,
		access_token: row.access_token,
		expires_at: row.expires_at,
		token_type: row.token_type,
		scope: row.scope,
		id_token: row.id_token,
		session_state: row.session_state,
	};
}

function mapSessions(
	row: SqliteSelect<typeof sqliteSchema.sessions>
): PostgresInsert<typeof postgresSchema.sessions> {
	const expires = toOptionalDateFromMilliseconds(row.expires);
	return {
		sessionToken: row.sessionToken,
		userId: row.userId,
		expires: expires ?? new Date(),
	};
}

function mapVerificationTokens(
	row: SqliteSelect<typeof sqliteSchema.verificationTokens>
): PostgresInsert<typeof postgresSchema.verificationTokens> {
	const expires = toOptionalDateFromMilliseconds(row.expires);
	return {
		identifier: row.identifier,
		token: row.token,
		expires: expires ?? new Date(),
	};
}

function mapAuthenticators(
	row: SqliteSelect<typeof sqliteSchema.authenticators>
): PostgresInsert<typeof postgresSchema.authenticators> {
	return {
		credentialID: row.credentialID,
		userId: row.userId,
		providerAccountId: row.providerAccountId,
		credentialPublicKey: row.credentialPublicKey,
		counter: row.counter,
		credentialDeviceType: row.credentialDeviceType,
		credentialBackedUp: toBoolean(row.credentialBackedUp),
		transports: row.transports,
	};
}

function mapSignups(
	row: SqliteSelect<typeof sqliteSchema.signups>
): PostgresInsert<typeof postgresSchema.signups> {
	return {
		userId: row.userId,
		name: row.name,
		stdNo: row.stdNo,
		status: row.status,
		message: row.message,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
		updatedAt: toOptionalDateFromSeconds(row.updatedAt),
	};
}

function mapStudents(
	row: SqliteSelect<typeof sqliteSchema.students>
): PostgresInsert<typeof postgresSchema.students> {
	return {
		stdNo: row.stdNo,
		name: row.name,
		nationalId: row.nationalId,
		sem: row.sem,
		dateOfBirth: toOptionalDateFromMilliseconds(row.dateOfBirth),
		phone1: row.phone1,
		phone2: row.phone2,
		gender: row.gender === 'Other' ? 'Unknown' : row.gender,
		maritalStatus: row.maritalStatus,
		religion: row.religion,
		userId: row.userId,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapStudentPrograms(
	row: SqliteSelect<typeof sqliteSchema.studentPrograms>
): PostgresInsert<typeof postgresSchema.studentPrograms> {
	return {
		id: row.id,
		stdNo: row.stdNo,
		intakeDate: row.intakeDate,
		regDate: row.regDate,
		startTerm: row.startTerm,
		structureId: row.structureId,
		stream: row.stream,
		graduationDate: row.graduationDate,
		status: row.status,
		assistProvider: row.assistProvider,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapStudentSemesters(
	row: SqliteSelect<typeof sqliteSchema.studentSemesters>
): PostgresInsert<typeof postgresSchema.studentSemesters> {
	return {
		id: row.id,
		term: row.term,
		semesterNumber: row.semesterNumber,
		status: row.status,
		studentProgramId: row.studentProgramId,
		cafDate: row.cafDate,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapStudentModules(
	row: SqliteSelect<typeof sqliteSchema.studentModules>
): PostgresInsert<typeof postgresSchema.studentModules> {
	return {
		id: row.id,
		semesterModuleId: row.semesterModuleId,
		status: row.status,
		marks: row.marks,
		grade: row.grade,
		studentSemesterId: row.studentSemesterId,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapSchools(
	row: SqliteSelect<typeof sqliteSchema.schools>
): PostgresInsert<typeof postgresSchema.schools> {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		isActive: toBoolean(row.isActive),
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapPrograms(
	row: SqliteSelect<typeof sqliteSchema.programs>
): PostgresInsert<typeof postgresSchema.programs> {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		level: row.level,
		schoolId: row.schoolId,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapStructures(
	row: SqliteSelect<typeof sqliteSchema.structures>
): PostgresInsert<typeof postgresSchema.structures> {
	return {
		id: row.id,
		code: row.code,
		desc: row.desc,
		programId: row.programId,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapStructureSemesters(
	row: SqliteSelect<typeof sqliteSchema.structureSemesters>
): PostgresInsert<typeof postgresSchema.structureSemesters> {
	return {
		id: row.id,
		structureId: row.structureId,
		semesterNumber: row.semesterNumber,
		name: row.name,
		totalCredits: row.totalCredits,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapModules(
	row: SqliteSelect<typeof sqliteSchema.modules>
): PostgresInsert<typeof postgresSchema.modules> {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		status: row.status,
		timestamp: row.timestamp,
	};
}

function mapSemesterModules(
	row: SqliteSelect<typeof sqliteSchema.semesterModules>
): PostgresInsert<typeof postgresSchema.semesterModules> {
	return {
		id: row.id,
		moduleId: row.moduleId,
		type: row.type,
		credits: row.credits,
		semesterId: row.semesterId,
		hidden: toBoolean(row.hidden),
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapModulePrerequisites(
	row: SqliteSelect<typeof sqliteSchema.modulePrerequisites>
): PostgresInsert<typeof postgresSchema.modulePrerequisites> {
	return {
		id: row.id,
		semesterModuleId: row.semesterModuleId,
		prerequisiteId: row.prerequisiteId,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapTerms(
	row: SqliteSelect<typeof sqliteSchema.terms>
): PostgresInsert<typeof postgresSchema.terms> {
	return {
		id: row.id,
		name: row.name,
		isActive: toBoolean(row.isActive),
		semester: row.semester,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapRegistrationRequests(
	row: SqliteSelect<typeof sqliteSchema.registrationRequests>
): PostgresInsert<typeof postgresSchema.registrationRequests> {
	return {
		id: row.id,
		sponsorId: row.sponsorId,
		stdNo: row.stdNo,
		termId: row.termId,
		status: row.status,
		mailSent: toBoolean(row.mailSent),
		count: row.count,
		semesterStatus: row.semesterStatus,
		semesterNumber: row.semesterNumber,
		message: row.message,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
		updatedAt: toOptionalDateFromSeconds(row.updatedAt),
		dateApproved: toOptionalDateFromSeconds(row.dateApproved),
	};
}

function mapRequestedModules(
	row: SqliteSelect<typeof sqliteSchema.requestedModules>
): PostgresInsert<typeof postgresSchema.requestedModules> {
	return {
		id: row.id,
		moduleStatus: row.moduleStatus,
		registrationRequestId: row.registrationRequestId,
		semesterModuleId: row.semesterModuleId,
		status: row.status,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapClearance(
	row: SqliteSelect<typeof sqliteSchema.clearance>
): PostgresInsert<typeof postgresSchema.clearance> {
	return {
		id: row.id,
		department: row.department,
		status: row.status,
		message: row.message,
		emailSent: toBoolean(row.emailSent),
		respondedBy: row.respondedBy,
		responseDate: toOptionalDateFromSeconds(row.responseDate),
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapRegistrationClearance(
	row: SqliteSelect<typeof sqliteSchema.registrationClearance>
): PostgresInsert<typeof postgresSchema.registrationClearance> {
	return {
		id: row.id,
		registrationRequestId: row.registrationRequestId,
		clearanceId: row.clearanceId,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapGraduationRequests(
	row: SqliteSelect<typeof sqliteSchema.graduationRequests>
): PostgresInsert<typeof postgresSchema.graduationRequests> {
	return {
		id: row.id,
		studentProgramId: row.studentProgramId,
		informationConfirmed: toBoolean(row.informationConfirmed),
		message: row.message,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
		updatedAt: toOptionalDateFromSeconds(row.updatedAt),
	};
}

function mapGraduationClearance(
	row: SqliteSelect<typeof sqliteSchema.graduationClearance>
): PostgresInsert<typeof postgresSchema.graduationClearance> {
	return {
		id: row.id,
		graduationRequestId: row.graduationRequestId,
		clearanceId: row.clearanceId,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapGraduationLists(
	row: SqliteSelect<typeof sqliteSchema.graduationLists>
): PostgresInsert<typeof postgresSchema.graduationLists> {
	return {
		id: row.id,
		name: row.name,
		spreadsheetId: row.spreadsheetId,
		spreadsheetUrl: row.spreadsheetUrl,
		status: row.status,
		createdBy: row.createdBy,
		populatedAt: toOptionalDateFromSeconds(row.populatedAt),
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapPaymentReceipts(
	row: SqliteSelect<typeof sqliteSchema.paymentReceipts>
): PostgresInsert<typeof postgresSchema.paymentReceipts> {
	return {
		id: row.id,
		graduationRequestId: row.graduationRequestId,
		paymentType: row.paymentType,
		receiptNo: row.receiptNo,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapClearanceAudit(
	row: SqliteSelect<typeof sqliteSchema.clearanceAudit>
): PostgresInsert<typeof postgresSchema.clearanceAudit> {
	const date = toOptionalDateFromSeconds(row.date);
	return {
		id: row.id,
		clearanceId: row.clearanceId,
		previousStatus: row.previousStatus,
		newStatus: row.newStatus,
		createdBy: row.createdBy,
		date: date ?? new Date(),
		message: row.message,
		modules: parseJsonArray(row.modules),
	};
}

function mapSponsors(
	row: SqliteSelect<typeof sqliteSchema.sponsors>
): PostgresInsert<typeof postgresSchema.sponsors> {
	return {
		id: row.id,
		name: row.name,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
		updatedAt: toOptionalDateFromSeconds(row.updatedAt),
	};
}

function mapSponsoredStudents(
	row: SqliteSelect<typeof sqliteSchema.sponsoredStudents>
): PostgresInsert<typeof postgresSchema.sponsoredStudents> {
	return {
		id: row.id,
		sponsorId: row.sponsorId,
		stdNo: row.stdNo,
		borrowerNo: row.borrowerNo,
		bankName: row.bankName,
		accountNumber: row.accountNumber,
		confirmed: toOptionalBoolean(row.confirmed),
		createdAt: toOptionalDateFromSeconds(row.createdAt),
		updatedAt: toOptionalDateFromSeconds(row.updatedAt),
	};
}

function mapSponsoredTerms(
	row: SqliteSelect<typeof sqliteSchema.sponsoredTerms>
): PostgresInsert<typeof postgresSchema.sponsoredTerms> {
	return {
		id: row.id,
		sponsoredStudentId: row.sponsoredStudentId,
		termId: row.termId,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
		updatedAt: toOptionalDateFromSeconds(row.updatedAt),
	};
}

function mapAssignedModules(
	row: SqliteSelect<typeof sqliteSchema.assignedModules>
): PostgresInsert<typeof postgresSchema.assignedModules> {
	return {
		id: row.id,
		termId: row.termId,
		active: toBoolean(row.active),
		userId: row.userId,
		semesterModuleId: row.semesterModuleId,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapUserSchools(
	row: SqliteSelect<typeof sqliteSchema.userSchools>
): PostgresInsert<typeof postgresSchema.userSchools> {
	return {
		id: row.id,
		userId: row.userId,
		schoolId: row.schoolId,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapAssessments(
	row: SqliteSelect<typeof sqliteSchema.assessments>
): PostgresInsert<typeof postgresSchema.assessments> {
	return {
		id: row.id,
		moduleId: row.moduleId,
		termId: row.termId,
		assessmentNumber: row.assessmentNumber,
		assessmentType: row.assessmentType,
		totalMarks: row.totalMarks,
		weight: row.weight,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapAssessmentMarks(
	row: SqliteSelect<typeof sqliteSchema.assessmentMarks>
): PostgresInsert<typeof postgresSchema.assessmentMarks> {
	return {
		id: row.id,
		assessmentId: row.assessmentId,
		stdNo: row.stdNo,
		marks: row.marks,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapAssessmentMarksAudit(
	row: SqliteSelect<typeof sqliteSchema.assessmentMarksAudit>
): PostgresInsert<typeof postgresSchema.assessmentMarksAudit> {
	const date = toOptionalDateFromSeconds(row.date);
	return {
		id: row.id,
		assessmentMarkId: row.assessmentMarkId,
		action: row.action,
		previousMarks: row.previousMarks,
		newMarks: row.newMarks,
		createdBy: row.createdBy,
		date: date ?? new Date(),
	};
}

function mapAssessmentsAudit(
	row: SqliteSelect<typeof sqliteSchema.assessmentsAudit>
): PostgresInsert<typeof postgresSchema.assessmentsAudit> {
	const date = toOptionalDateFromSeconds(row.date);
	return {
		id: row.id,
		assessmentId: row.assessmentId,
		action: row.action,
		previousAssessmentNumber: row.previousAssessmentNumber,
		newAssessmentNumber: row.newAssessmentNumber,
		previousAssessmentType: row.previousAssessmentType,
		newAssessmentType: row.newAssessmentType,
		previousTotalMarks: row.previousTotalMarks,
		newTotalMarks: row.newTotalMarks,
		previousWeight: row.previousWeight,
		newWeight: row.newWeight,
		createdBy: row.createdBy,
		date: date ?? new Date(),
	};
}

function mapModuleGrades(
	row: SqliteSelect<typeof sqliteSchema.moduleGrades>
): PostgresInsert<typeof postgresSchema.moduleGrades> {
	return {
		id: row.id,
		moduleId: row.moduleId,
		stdNo: row.stdNo,
		grade: row.grade,
		weightedTotal: row.weightedTotal,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
		updatedAt: toOptionalDateFromSeconds(row.updatedAt),
	};
}

function mapStatementOfResultsPrints(
	row: SqliteSelect<typeof sqliteSchema.statementOfResultsPrints>
): PostgresInsert<typeof postgresSchema.statementOfResultsPrints> {
	const printedAt = toOptionalDateFromSeconds(row.printedAt);
	return {
		id: row.id,
		stdNo: row.stdNo,
		printedBy: row.printedBy,
		studentName: row.studentName,
		programName: row.programName,
		totalCredits: row.totalCredits,
		totalModules: row.totalModules,
		cgpa: row.cgpa,
		classification: row.classification,
		academicStatus: row.academicStatus,
		graduationDate: row.graduationDate,
		printedAt: printedAt ?? new Date(),
	};
}

function mapTranscriptPrints(
	row: SqliteSelect<typeof sqliteSchema.transcriptPrints>
): PostgresInsert<typeof postgresSchema.transcriptPrints> {
	const printedAt = toOptionalDateFromSeconds(row.printedAt);
	return {
		id: row.id,
		stdNo: row.stdNo,
		printedBy: row.printedBy,
		studentName: row.studentName,
		programName: row.programName,
		totalCredits: row.totalCredits,
		cgpa: row.cgpa,
		printedAt: printedAt ?? new Date(),
	};
}

function mapBlockedStudents(
	row: SqliteSelect<typeof sqliteSchema.blockedStudents>
): PostgresInsert<typeof postgresSchema.blockedStudents> {
	return {
		id: row.id,
		status: row.status,
		reason: row.reason,
		byDepartment: row.byDepartment,
		stdNo: row.stdNo,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapStudentCardPrints(
	row: SqliteSelect<typeof sqliteSchema.studentCardPrints>
): PostgresInsert<typeof postgresSchema.studentCardPrints> {
	return {
		id: row.id,
		receiptNo: row.receiptNo,
		stdNo: row.stdNo,
		printedBy: row.printedBy,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapDocuments(
	row: SqliteSelect<typeof sqliteSchema.documents>
): PostgresInsert<typeof postgresSchema.documents> {
	return {
		id: row.id,
		fileName: row.fileName,
		type: row.type,
		stdNo: row.stdNo,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function mapFortinetRegistrations(
	row: SqliteSelect<typeof sqliteSchema.fortinetRegistrations>
): PostgresInsert<typeof postgresSchema.fortinetRegistrations> {
	return {
		id: row.id,
		stdNo: row.stdNo,
		schoolId: row.schoolId,
		level: row.level,
		status: row.status,
		message: row.message,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
		updatedAt: toOptionalDateFromSeconds(row.updatedAt),
	};
}

function mapTasks(
	row: SqliteSelect<typeof sqliteSchema.tasks>
): PostgresInsert<typeof postgresSchema.tasks> {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		status: row.status,
		priority: row.priority,
		department: row.department,
		createdBy: row.createdBy,
		scheduledFor: toOptionalDateFromSeconds(row.scheduledFor),
		dueDate: toOptionalDateFromSeconds(row.dueDate),
		completedAt: toOptionalDateFromSeconds(row.completedAt),
		createdAt: toOptionalDateFromSeconds(row.createdAt),
		updatedAt: toOptionalDateFromSeconds(row.updatedAt),
	};
}

function mapTaskAssignments(
	row: SqliteSelect<typeof sqliteSchema.taskAssignments>
): PostgresInsert<typeof postgresSchema.taskAssignments> {
	return {
		id: row.id,
		taskId: row.taskId,
		userId: row.userId,
		createdAt: toOptionalDateFromSeconds(row.createdAt),
	};
}

function definePlan<STable, PTable>(
	plan: MigrationPlan<STable, PTable>
): MigrationPlan<STable, PTable> {
	return plan;
}

const plans = [
	definePlan({
		name: 'users',
		sqliteTable: sqliteSchema.users,
		postgresTable: postgresSchema.users,
		map: mapUsers,
	}),
	definePlan({
		name: 'accounts',
		sqliteTable: sqliteSchema.accounts,
		postgresTable: postgresSchema.accounts,
		map: mapAccounts,
	}),
	definePlan({
		name: 'sessions',
		sqliteTable: sqliteSchema.sessions,
		postgresTable: postgresSchema.sessions,
		map: mapSessions,
	}),
	definePlan({
		name: 'verification_tokens',
		sqliteTable: sqliteSchema.verificationTokens,
		postgresTable: postgresSchema.verificationTokens,
		map: mapVerificationTokens,
	}),
	definePlan({
		name: 'authenticators',
		sqliteTable: sqliteSchema.authenticators,
		postgresTable: postgresSchema.authenticators,
		map: mapAuthenticators,
	}),
	definePlan({
		name: 'signups',
		sqliteTable: sqliteSchema.signups,
		postgresTable: postgresSchema.signups,
		map: mapSignups,
	}),
	definePlan({
		name: 'schools',
		sqliteTable: sqliteSchema.schools,
		postgresTable: postgresSchema.schools,
		map: mapSchools,
	}),
	definePlan({
		name: 'programs',
		sqliteTable: sqliteSchema.programs,
		postgresTable: postgresSchema.programs,
		map: mapPrograms,
	}),
	definePlan({
		name: 'structures',
		sqliteTable: sqliteSchema.structures,
		postgresTable: postgresSchema.structures,
		map: mapStructures,
	}),
	definePlan({
		name: 'structure_semesters',
		sqliteTable: sqliteSchema.structureSemesters,
		postgresTable: postgresSchema.structureSemesters,
		map: mapStructureSemesters,
	}),
	definePlan({
		name: 'modules',
		sqliteTable: sqliteSchema.modules,
		postgresTable: postgresSchema.modules,
		map: mapModules,
	}),
	definePlan({
		name: 'terms',
		sqliteTable: sqliteSchema.terms,
		postgresTable: postgresSchema.terms,
		map: mapTerms,
	}),
	definePlan({
		name: 'semester_modules',
		sqliteTable: sqliteSchema.semesterModules,
		postgresTable: postgresSchema.semesterModules,
		map: mapSemesterModules,
	}),
	definePlan({
		name: 'module_prerequisites',
		sqliteTable: sqliteSchema.modulePrerequisites,
		postgresTable: postgresSchema.modulePrerequisites,
		map: mapModulePrerequisites,
	}),
	definePlan({
		name: 'sponsors',
		sqliteTable: sqliteSchema.sponsors,
		postgresTable: postgresSchema.sponsors,
		map: mapSponsors,
	}),
	definePlan({
		name: 'students',
		sqliteTable: sqliteSchema.students,
		postgresTable: postgresSchema.students,
		map: mapStudents,
	}),
	definePlan({
		name: 'student_programs',
		sqliteTable: sqliteSchema.studentPrograms,
		postgresTable: postgresSchema.studentPrograms,
		map: mapStudentPrograms,
	}),
	definePlan({
		name: 'student_semesters',
		sqliteTable: sqliteSchema.studentSemesters,
		postgresTable: postgresSchema.studentSemesters,
		map: mapStudentSemesters,
	}),
	definePlan({
		name: 'student_modules',
		sqliteTable: sqliteSchema.studentModules,
		postgresTable: postgresSchema.studentModules,
		map: mapStudentModules,
	}),
	definePlan({
		name: 'sponsored_students',
		sqliteTable: sqliteSchema.sponsoredStudents,
		postgresTable: postgresSchema.sponsoredStudents,
		map: mapSponsoredStudents,
	}),
	definePlan({
		name: 'sponsored_terms',
		sqliteTable: sqliteSchema.sponsoredTerms,
		postgresTable: postgresSchema.sponsoredTerms,
		map: mapSponsoredTerms,
	}),
	definePlan({
		name: 'registration_requests',
		sqliteTable: sqliteSchema.registrationRequests,
		postgresTable: postgresSchema.registrationRequests,
		map: mapRegistrationRequests,
	}),
	definePlan({
		name: 'requested_modules',
		sqliteTable: sqliteSchema.requestedModules,
		postgresTable: postgresSchema.requestedModules,
		map: mapRequestedModules,
	}),
	definePlan({
		name: 'clearance',
		sqliteTable: sqliteSchema.clearance,
		postgresTable: postgresSchema.clearance,
		map: mapClearance,
	}),
	definePlan({
		name: 'registration_clearance',
		sqliteTable: sqliteSchema.registrationClearance,
		postgresTable: postgresSchema.registrationClearance,
		map: mapRegistrationClearance,
	}),
	definePlan({
		name: 'graduation_lists',
		sqliteTable: sqliteSchema.graduationLists,
		postgresTable: postgresSchema.graduationLists,
		map: mapGraduationLists,
	}),
	definePlan({
		name: 'graduation_requests',
		sqliteTable: sqliteSchema.graduationRequests,
		postgresTable: postgresSchema.graduationRequests,
		map: mapGraduationRequests,
	}),
	definePlan({
		name: 'graduation_clearance',
		sqliteTable: sqliteSchema.graduationClearance,
		postgresTable: postgresSchema.graduationClearance,
		map: mapGraduationClearance,
	}),
	definePlan({
		name: 'payment_receipts',
		sqliteTable: sqliteSchema.paymentReceipts,
		postgresTable: postgresSchema.paymentReceipts,
		map: mapPaymentReceipts,
	}),
	definePlan({
		name: 'clearance_audit',
		sqliteTable: sqliteSchema.clearanceAudit,
		postgresTable: postgresSchema.clearanceAudit,
		map: mapClearanceAudit,
	}),
	definePlan({
		name: 'assigned_modules',
		sqliteTable: sqliteSchema.assignedModules,
		postgresTable: postgresSchema.assignedModules,
		map: mapAssignedModules,
	}),
	definePlan({
		name: 'user_schools',
		sqliteTable: sqliteSchema.userSchools,
		postgresTable: postgresSchema.userSchools,
		map: mapUserSchools,
	}),
	definePlan({
		name: 'assessments',
		sqliteTable: sqliteSchema.assessments,
		postgresTable: postgresSchema.assessments,
		map: mapAssessments,
	}),
	definePlan({
		name: 'assessment_marks',
		sqliteTable: sqliteSchema.assessmentMarks,
		postgresTable: postgresSchema.assessmentMarks,
		map: mapAssessmentMarks,
	}),
	definePlan({
		name: 'assessment_marks_audit',
		sqliteTable: sqliteSchema.assessmentMarksAudit,
		postgresTable: postgresSchema.assessmentMarksAudit,
		map: mapAssessmentMarksAudit,
	}),
	definePlan({
		name: 'assessments_audit',
		sqliteTable: sqliteSchema.assessmentsAudit,
		postgresTable: postgresSchema.assessmentsAudit,
		map: mapAssessmentsAudit,
	}),
	definePlan({
		name: 'module_grades',
		sqliteTable: sqliteSchema.moduleGrades,
		postgresTable: postgresSchema.moduleGrades,
		map: mapModuleGrades,
	}),
	definePlan({
		name: 'statement_of_results_prints',
		sqliteTable: sqliteSchema.statementOfResultsPrints,
		postgresTable: postgresSchema.statementOfResultsPrints,
		map: mapStatementOfResultsPrints,
	}),
	definePlan({
		name: 'transcript_prints',
		sqliteTable: sqliteSchema.transcriptPrints,
		postgresTable: postgresSchema.transcriptPrints,
		map: mapTranscriptPrints,
	}),
	definePlan({
		name: 'blocked_students',
		sqliteTable: sqliteSchema.blockedStudents,
		postgresTable: postgresSchema.blockedStudents,
		map: mapBlockedStudents,
	}),
	definePlan({
		name: 'student_card_prints',
		sqliteTable: sqliteSchema.studentCardPrints,
		postgresTable: postgresSchema.studentCardPrints,
		map: mapStudentCardPrints,
	}),
	definePlan({
		name: 'documents',
		sqliteTable: sqliteSchema.documents,
		postgresTable: postgresSchema.documents,
		map: mapDocuments,
	}),
	definePlan({
		name: 'fortinet_registrations',
		sqliteTable: sqliteSchema.fortinetRegistrations,
		postgresTable: postgresSchema.fortinetRegistrations,
		map: mapFortinetRegistrations,
	}),
	definePlan({
		name: 'tasks',
		sqliteTable: sqliteSchema.tasks,
		postgresTable: postgresSchema.tasks,
		map: mapTasks,
	}),
	definePlan({
		name: 'task_assignments',
		sqliteTable: sqliteSchema.taskAssignments,
		postgresTable: postgresSchema.taskAssignments,
		map: mapTaskAssignments,
	}),
] as const;

async function migrateTables(
	sqliteDb: ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>,
	postgresDb: ReturnType<typeof drizzlePostgres<typeof postgresSchema>>
): Promise<void> {
	let totalMigrated = 0;
	let totalSkipped = 0;
	let totalEnumFixed = 0;

	for (let i = 0; i < plans.length; i++) {
		const plan = plans[i];
		console.log(`${i + 1}/${plans.length}) Migrating ${plan.name}...`);

		const rows = sqliteDb.select().from(plan.sqliteTable).all();
		if (rows.length === 0) {
			continue;
		}
		let filteredRows = rows;
		let skipped = 0;
		if (plan.name === 'student_modules') {
			const validStudentSemesterIds = getStudentSemesterIds(sqliteDb);
			filteredRows = rows.filter(function filterStudentModules(row) {
				const r = row as Record<string, unknown>;
				if (r.studentSemesterId === null || r.studentSemesterId === undefined) {
					return false;
				}
				return validStudentSemesterIds.has(r.studentSemesterId as number);
			});
			skipped = rows.length - filteredRows.length;
			totalSkipped += skipped;
		}
		const transformed = filteredRows.map(function transformRow(row) {
			const rowObj = row as Record<string, unknown>;
			const mappedRow = applyEnumMapping(rowObj, plan.name);
			return (plan as MigrationPlan<unknown, unknown>).map(mappedRow as never);
		});
		const normalised = transformed.map(function normaliseRow(row) {
			const result: Record<string, unknown> = {};
			for (const key of Object.keys(row)) {
				result[key] = normaliseForPostgres((row as Record<string, unknown>)[key]);
			}
			return result;
		});

		const validatedRows: Record<string, unknown>[] = [];
		let enumSkipped = 0;

		for (let rowIndex = 0; rowIndex < normalised.length; rowIndex++) {
			const row = normalised[rowIndex];
			const originalRow = filteredRows[rowIndex];
			const rowIdentifier = getRowIdentifier(
				originalRow as never,
				plan as MigrationPlan<unknown, unknown>
			);

			const mappedRow = applyEnumMapping(row, plan.name);

			const validatedRow = await validateAndFixEnumValues(mappedRow, plan.name, rowIdentifier);

			if (validatedRow === null) {
				enumSkipped++;
				totalSkipped++;
				continue;
			}

			if (JSON.stringify(validatedRow) !== JSON.stringify(row)) {
				totalEnumFixed++;
			}

			validatedRows.push(validatedRow);
		}

		if (enumSkipped > 0) {
			console.log(`  ⚠️  Skipped ${enumSkipped} rows due to invalid enum values`);
		}

		const chunks = chunkArray(validatedRows, BATCH_SIZE);
		for (const chunk of chunks) {
			try {
				await postgresDb
					.insert(plan.postgresTable)
					.values(chunk as never[])
					.onConflictDoNothing();
			} catch (error) {
				console.error(`\n❌ Error inserting batch for ${plan.name}:`);
				if (error instanceof Error) {
					console.error(`   ${error.message}`);

					if (error.message.includes('enum')) {
						console.error('\n   This appears to be an enum validation error.');
						console.error('   The interactive prompt should have caught this.');
						console.error('   Please report this issue with the error details above.');
					}
				}
				throw error;
			}
		}
		totalMigrated += validatedRows.length;
	}

	console.log(`✓ Migrated ${totalMigrated} rows across ${plans.length} tables.`);
	if (totalSkipped > 0) {
		console.log(`  (Skipped ${totalSkipped} rows total)`);
	}
	if (totalEnumFixed > 0) {
		console.log(`  ✓ Fixed ${totalEnumFixed} enum values interactively`);
	}
}

async function verifyTables(
	sqliteDb: ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>,
	postgresDb: ReturnType<typeof drizzlePostgres<typeof postgresSchema>>
): Promise<ReadonlyArray<VerificationResult>> {
	const results: VerificationResult[] = [];
	const failedTables: string[] = [];

	for (const plan of plans) {
		const sqliteRawRows = sqliteDb.select().from(plan.sqliteTable).all();
		let filteredSqliteRows = sqliteRawRows;

		if (plan.name === 'student_modules') {
			const validStudentSemesterIds = getStudentSemesterIds(sqliteDb);
			filteredSqliteRows = sqliteRawRows.filter(function filterStudentModules(row) {
				const r = row as Record<string, unknown>;
				if (r.studentSemesterId === null || r.studentSemesterId === undefined) {
					return false;
				}
				return validStudentSemesterIds.has(r.studentSemesterId as number);
			});
		}

		const postgresRows = await postgresDb.select().from(plan.postgresTable);
		const countMatches = filteredSqliteRows.length === postgresRows.length;

		const sqliteRowMap = new Map<string, Record<string, unknown>>();
		const postgresRowMap = new Map<string, Record<string, unknown>>();

		for (const row of filteredSqliteRows) {
			const transformed = (plan as MigrationPlan<unknown, unknown>).map(row as never);
			const normalised: Record<string, unknown> = {};
			for (const key of Object.keys(transformed)) {
				normalised[key] = normaliseValue((transformed as Record<string, unknown>)[key]);
			}
			const key = createRowKey(normalised);
			sqliteRowMap.set(key, normalised);
		}

		for (const row of postgresRows) {
			const normalised: Record<string, unknown> = {};
			for (const key of Object.keys(row)) {
				normalised[key] = normaliseValue((row as Record<string, unknown>)[key]);
			}
			const key = createRowKey(normalised);
			postgresRowMap.set(key, normalised);
		}

		const missingInPostgres: Record<string, unknown>[] = [];
		const extraInPostgres: Record<string, unknown>[] = [];
		const rowMismatches: DetailedRowMismatch[] = [];
		const fieldMismatches: FieldMismatch[] = [];

		for (const [key, sqliteRow] of sqliteRowMap) {
			if (!postgresRowMap.has(key)) {
				missingInPostgres.push(sqliteRow);
			}
		}

		for (const [key, postgresRow] of postgresRowMap) {
			if (!sqliteRowMap.has(key)) {
				extraInPostgres.push(postgresRow);
			}
		}

		if (filteredSqliteRows.length > 0 && postgresRows.length > 0) {
			const sqliteByIdentifier = new Map<string, Record<string, unknown>>();
			const postgresByIdentifier = new Map<string, Record<string, unknown>>();

			for (let i = 0; i < filteredSqliteRows.length; i++) {
				const row = filteredSqliteRows[i];
				const identifier = getRowIdentifier(row as never, plan as never);
				const identifierKey = JSON.stringify(identifier);
				const transformed = (plan as MigrationPlan<unknown, unknown>).map(row as never);
				const normalised: Record<string, unknown> = {};
				for (const key of Object.keys(transformed)) {
					normalised[key] = (transformed as Record<string, unknown>)[key];
				}
				sqliteByIdentifier.set(identifierKey, normalised);
			}

			for (const row of postgresRows) {
				const identifier = getRowIdentifier(row as never, plan as never);
				const identifierKey = JSON.stringify(identifier);
				postgresByIdentifier.set(identifierKey, row as Record<string, unknown>);
			}

			for (const [identifierKey, sqliteRow] of sqliteByIdentifier) {
				const postgresRow = postgresByIdentifier.get(identifierKey);
				if (postgresRow) {
					const differences = compareRows(sqliteRow, postgresRow);
					if (differences.length > 0) {
						const identifier = JSON.parse(identifierKey);
						rowMismatches.push({
							identifier,
							sqliteRow,
							postgresRow,
							differentFields: differences,
						});

						for (const diff of differences) {
							if (fieldMismatches.length < MAX_MISMATCHES_TO_SHOW) {
								fieldMismatches.push({
									field: diff.field,
									sqliteValue: diff.sqliteValue,
									postgresValue: diff.postgresValue,
									sqliteType: diff.sqliteType,
									postgresType: diff.postgresType,
									identifier,
								});
							}
						}
					}
				}
			}
		}

		const passed =
			countMatches &&
			missingInPostgres.length === 0 &&
			extraInPostgres.length === 0 &&
			rowMismatches.length === 0 &&
			fieldMismatches.length === 0;

		if (!passed) {
			failedTables.push(plan.name);
		}

		results.push({
			table: plan.name,
			passed,
			sqliteCount: filteredSqliteRows.length,
			postgresCount: postgresRows.length,
			countMatches,
			rowMismatches,
			missingInPostgres,
			extraInPostgres,
			fieldMismatches,
			referentialIntegrityIssues: [],
		});
	}

	if (failedTables.length === 0) {
		console.log(`✓ Verified ${results.length} tables successfully.`);
	} else {
		console.log(`\n✗ Verification failed for ${failedTables.length} table(s):`);
		for (const result of results.filter((r) => !r.passed)) {
			console.log(`  - ${result.table}`);
			if (result.sqliteCount !== result.postgresCount) {
				console.log(
					`      Count mismatch: SQLite ${result.sqliteCount} vs Postgres ${result.postgresCount}`
				);
			}
			if (result.missingInPostgres.length > 0) {
				console.log(`      Missing in Postgres: ${result.missingInPostgres.length} rows`);
			}
			if (result.extraInPostgres.length > 0) {
				console.log(`      Extra in Postgres: ${result.extraInPostgres.length} rows`);
			}
			if (result.rowMismatches.length > 0) {
				console.log(`      Row mismatches: ${result.rowMismatches.length}`);
			}
			if (result.fieldMismatches.length > 0) {
				console.log(`      Field mismatches: ${result.fieldMismatches.length}`);
			}
		}
	}

	return results;
}

function parseMode(): Mode {
	const argument = process.argv[2];
	if (!argument) {
		return 'migrate-and-verify';
	}
	if (argument === 'migrate') {
		return 'migrate';
	}
	if (argument === 'verify') {
		return 'verify';
	}
	if (argument === 'migrate-and-verify') {
		return 'migrate-and-verify';
	}
	throw new Error(`Unknown mode "${argument}". Use migrate, verify, or migrate-and-verify.`);
}

async function run(): Promise<void> {
	assertEnvironment();
	const mode = parseMode();
	loadEnumMappingsFromFile();
	cleanupSqliteDatabase();
	const sqliteDb = openSqliteDatabase();
	const postgresDb = await openPostgresDatabase();

	try {
		if (mode === 'migrate' || mode === 'migrate-and-verify') {
			console.log('\n📦 Migrating data from SQLite to PostgreSQL...\n');
			await migrateTables(sqliteDb, postgresDb);
		}

		if (mode === 'verify' || mode === 'migrate-and-verify') {
			console.log('\n🔍 Verifying migration...\n');

			let allPassed = true;
			for (let round = 1; round <= 3; round++) {
				const results = await verifyTables(sqliteDb, postgresDb);
				const roundPassed = results.every((r) => r.passed);

				if (!roundPassed) {
					allPassed = false;
					if (round < 3) {
						await new Promise((resolve) => setTimeout(resolve, 2000));
					}
				} else {
					break;
				}
			}

			if (allPassed) {
				console.log('\n✓ Migration completed successfully!\n');
			} else {
				console.log('\n✗ Migration verification failed!\n');
				process.exit(1);
			}
		}
	} finally {
		await closePostgresDatabase(postgresDb);
		closeSqliteDatabase(sqliteDb);
	}
}

run().catch(function handleError(error) {
	console.error('Migration script failed.');
	console.error(error);
	process.exit(1);
});
