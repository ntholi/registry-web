import '../../src/core/database/env-load';
import { sql } from 'drizzle-orm';
import {
	applicants,
	db,
	employees,
	guardians,
	students,
} from '@/core/database';
import {
	type DistortionRuleCounts,
	mergeRuleCounts,
	repairLegacyDistortedPersonName,
} from './person-name-distortion-repair';

type TableName = 'all' | 'applicants' | 'guardians' | 'employees' | 'students';

interface ScriptArgs {
	shouldApply: boolean;
	table: TableName;
	limit?: number;
	preview: number;
	batchSize: number;
}

interface ChangePreview {
	key: string;
	before: string;
	after: string;
}

interface RepairSummary {
	inspected: number;
	updated: number;
	preview: ChangePreview[];
	rules: DistortionRuleCounts;
}

function createEmptyRuleCounts(): DistortionRuleCounts {
	return {
		apostropheMiddle: 0,
		apostropheLeading: 0,
		apostropheUnicode: 0,
		legacyMacVariant: 0,
	};
}

function parsePositiveInt(value: string | undefined) {
	if (!value) return undefined;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new Error(`Invalid positive integer value: ${value}`);
	}
	return parsed;
}

function parseTableName(value: string | undefined): TableName {
	if (!value) return 'all';
	if (
		value === 'all' ||
		value === 'applicants' ||
		value === 'guardians' ||
		value === 'employees' ||
		value === 'students'
	) {
		return value;
	}
	throw new Error(
		`Invalid table value: ${value}. Use one of all, applicants, guardians, employees, students.`
	);
}

function parseArgs(): ScriptArgs {
	const shouldApply = process.argv.includes('--apply');
	const tableArg = process.argv
		.find((arg) => arg.startsWith('--table='))
		?.split('=')[1];
	const limitArg = process.argv
		.find((arg) => arg.startsWith('--limit='))
		?.split('=')[1];
	const previewArg = process.argv
		.find((arg) => arg.startsWith('--preview='))
		?.split('=')[1];
	const batchSizeArg = process.argv
		.find((arg) => arg.startsWith('--batch-size='))
		?.split('=')[1];

	return {
		shouldApply,
		table: parseTableName(tableArg),
		limit: parsePositiveInt(limitArg),
		preview: parsePositiveInt(previewArg) ?? 15,
		batchSize: parsePositiveInt(batchSizeArg) ?? 500,
	};
}

async function runInBatches<T>(
	items: T[],
	batchSize: number,
	handler: (batch: T[]) => Promise<void>
) {
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		await handler(batch);
	}
}

async function repairApplicantNames(args: ScriptArgs): Promise<RepairSummary> {
	const query = db
		.select({ id: applicants.id, fullName: applicants.fullName })
		.from(applicants);
	const rows = args.limit ? await query.limit(args.limit) : await query;

	const updates: { id: string; fullName: string }[] = [];
	const preview: ChangePreview[] = [];
	const rules = createEmptyRuleCounts();

	for (const row of rows) {
		const result = repairLegacyDistortedPersonName(row.fullName);
		if (!result || !result.changed) continue;
		updates.push({ id: row.id, fullName: result.repairedName });
		mergeRuleCounts(rules, result.rules);
		if (preview.length < args.preview && row.fullName) {
			preview.push({
				key: row.id,
				before: row.fullName,
				after: result.repairedName,
			});
		}
	}

	if (args.shouldApply && updates.length > 0) {
		await runInBatches(updates, args.batchSize, async (batch) => {
			await db.execute(sql`
				UPDATE ${applicants} AS target
				SET full_name = source.full_name
				FROM (VALUES ${sql.join(
					batch.map((row) => sql`(${row.id}, ${row.fullName})`),
					sql`, `
				)}) AS source(id, full_name)
				WHERE target.id = source.id
			`);
		});
	}

	return {
		inspected: rows.length,
		updated: updates.length,
		preview,
		rules,
	};
}

async function repairGuardianNames(args: ScriptArgs): Promise<RepairSummary> {
	const query = db
		.select({ id: guardians.id, name: guardians.name })
		.from(guardians);
	const rows = args.limit ? await query.limit(args.limit) : await query;

	const updates: { id: string; name: string }[] = [];
	const preview: ChangePreview[] = [];
	const rules = createEmptyRuleCounts();

	for (const row of rows) {
		const result = repairLegacyDistortedPersonName(row.name);
		if (!result || !result.changed) continue;
		updates.push({ id: row.id, name: result.repairedName });
		mergeRuleCounts(rules, result.rules);
		if (preview.length < args.preview && row.name) {
			preview.push({
				key: row.id,
				before: row.name,
				after: result.repairedName,
			});
		}
	}

	if (args.shouldApply && updates.length > 0) {
		await runInBatches(updates, args.batchSize, async (batch) => {
			await db.execute(sql`
				UPDATE ${guardians} AS target
				SET name = source.name
				FROM (VALUES ${sql.join(
					batch.map((row) => sql`(${row.id}, ${row.name})`),
					sql`, `
				)}) AS source(id, name)
				WHERE target.id = source.id
			`);
		});
	}

	return {
		inspected: rows.length,
		updated: updates.length,
		preview,
		rules,
	};
}

async function repairEmployeeNames(args: ScriptArgs): Promise<RepairSummary> {
	const query = db
		.select({ empNo: employees.empNo, name: employees.name })
		.from(employees);
	const rows = args.limit ? await query.limit(args.limit) : await query;

	const updates: { empNo: string; name: string }[] = [];
	const preview: ChangePreview[] = [];
	const rules = createEmptyRuleCounts();

	for (const row of rows) {
		const result = repairLegacyDistortedPersonName(row.name);
		if (!result || !result.changed) continue;
		updates.push({ empNo: row.empNo, name: result.repairedName });
		mergeRuleCounts(rules, result.rules);
		if (preview.length < args.preview && row.name) {
			preview.push({
				key: row.empNo,
				before: row.name,
				after: result.repairedName,
			});
		}
	}

	if (args.shouldApply && updates.length > 0) {
		await runInBatches(updates, args.batchSize, async (batch) => {
			await db.execute(sql`
				UPDATE ${employees} AS target
				SET name = source.name
				FROM (VALUES ${sql.join(
					batch.map((row) => sql`(${row.empNo}, ${row.name})`),
					sql`, `
				)}) AS source(emp_no, name)
				WHERE target.emp_no = source.emp_no
			`);
		});
	}

	return {
		inspected: rows.length,
		updated: updates.length,
		preview,
		rules,
	};
}

async function repairStudentNames(args: ScriptArgs): Promise<RepairSummary> {
	const query = db
		.select({ stdNo: students.stdNo, name: students.name })
		.from(students);
	const rows = args.limit ? await query.limit(args.limit) : await query;

	const updates: { stdNo: number; name: string }[] = [];
	const preview: ChangePreview[] = [];
	const rules = createEmptyRuleCounts();

	for (const row of rows) {
		const result = repairLegacyDistortedPersonName(row.name);
		if (!result || !result.changed) continue;
		updates.push({ stdNo: row.stdNo, name: result.repairedName });
		mergeRuleCounts(rules, result.rules);
		if (preview.length < args.preview && row.name) {
			preview.push({
				key: String(row.stdNo),
				before: row.name,
				after: result.repairedName,
			});
		}
	}

	if (args.shouldApply && updates.length > 0) {
		await runInBatches(updates, args.batchSize, async (batch) => {
			await db.execute(sql`
				UPDATE ${students} AS target
				SET name = source.name
				FROM (VALUES ${sql.join(
					batch.map((row) => sql`(${row.stdNo}, ${row.name})`),
					sql`, `
				)}) AS source(std_no, name)
				WHERE target.std_no = source.std_no::bigint
			`);
		});
	}

	return {
		inspected: rows.length,
		updated: updates.length,
		preview,
		rules,
	};
}

function printPreview(label: string, preview: ChangePreview[]) {
	if (preview.length === 0) return;
	console.log(`\n${label} preview:`);
	for (const row of preview) {
		console.log(`- ${row.key}: ${row.before} -> ${row.after}`);
	}
}

function printRuleSummary(label: string, rules: DistortionRuleCounts) {
	console.log(
		[
			`${label} rules:`,
			`  apostropheMiddle: ${rules.apostropheMiddle}`,
			`  apostropheLeading: ${rules.apostropheLeading}`,
			`  apostropheUnicode: ${rules.apostropheUnicode}`,
			`  legacyMacVariant: ${rules.legacyMacVariant}`,
		].join('\n')
	);
}

async function main() {
	const args = parseArgs();
	const totals = createEmptyRuleCounts();

	const applicantsResult =
		args.table === 'all' || args.table === 'applicants'
			? await repairApplicantNames(args)
			: undefined;
	const guardiansResult =
		args.table === 'all' || args.table === 'guardians'
			? await repairGuardianNames(args)
			: undefined;
	const employeesResult =
		args.table === 'all' || args.table === 'employees'
			? await repairEmployeeNames(args)
			: undefined;
	const studentsResult =
		args.table === 'all' || args.table === 'students'
			? await repairStudentNames(args)
			: undefined;

	if (applicantsResult) mergeRuleCounts(totals, applicantsResult.rules);
	if (guardiansResult) mergeRuleCounts(totals, guardiansResult.rules);
	if (employeesResult) mergeRuleCounts(totals, employeesResult.rules);
	if (studentsResult) mergeRuleCounts(totals, studentsResult.rules);

	console.log(
		[
			`Mode: ${args.shouldApply ? 'apply' : 'dry-run'}`,
			`Table scope: ${args.table}`,
			`Limit: ${args.limit ?? 'none'}`,
			`Batch size: ${args.batchSize}`,
			`Preview rows per table: ${args.preview}`,
			`Applicants inspected: ${applicantsResult?.inspected ?? 0}`,
			`Applicants updates: ${applicantsResult?.updated ?? 0}`,
			`Guardians inspected: ${guardiansResult?.inspected ?? 0}`,
			`Guardians updates: ${guardiansResult?.updated ?? 0}`,
			`Employees inspected: ${employeesResult?.inspected ?? 0}`,
			`Employees updates: ${employeesResult?.updated ?? 0}`,
			`Students inspected: ${studentsResult?.inspected ?? 0}`,
			`Students updates: ${studentsResult?.updated ?? 0}`,
		].join('\n')
	);

	printRuleSummary('Total', totals);

	if (applicantsResult) {
		printRuleSummary('Applicants', applicantsResult.rules);
		printPreview('Applicants', applicantsResult.preview);
	}
	if (guardiansResult) {
		printRuleSummary('Guardians', guardiansResult.rules);
		printPreview('Guardians', guardiansResult.preview);
	}
	if (employeesResult) {
		printRuleSummary('Employees', employeesResult.rules);
		printPreview('Employees', employeesResult.preview);
	}
	if (studentsResult) {
		printRuleSummary('Students', studentsResult.rules);
		printPreview('Students', studentsResult.preview);
	}
}

main().catch((error) => {
	console.error('Failed to repair distorted person names:', error);
	process.exit(1);
});
