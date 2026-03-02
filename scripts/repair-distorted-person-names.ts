import '../src/core/database/env-load';
import { sql } from 'drizzle-orm';
import {
	applicants,
	db,
	employees,
	guardians,
	students,
} from '@/core/database';

interface ChangePreview {
	key: string;
	before: string;
	after: string;
}

interface RepairSummary {
	inspected: number;
	updated: number;
	preview: ChangePreview[];
}

function capitalizeNamePart(part: string) {
	if (!part) return '';
	return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

function repairLegacyDistortedWordPart(part: string) {
	const apostropheMatch = part.match(/^([A-Za-z]{2,})'([A-Z][a-z]+)$/);
	if (apostropheMatch) {
		const [, first, second] = apostropheMatch;
		return `${capitalizeNamePart(first)}'${second.toLowerCase()}`;
	}

	const macHMatch = part.match(/^MacH([A-Za-z]+)$/);
	if (macHMatch) {
		const [, suffix] = macHMatch;
		return `Mach${suffix.toLowerCase()}`;
	}

	const mcHMatch = part.match(/^McH([A-Za-z]+)$/);
	if (mcHMatch) {
		const [, suffix] = mcHMatch;
		return `Mch${suffix.toLowerCase()}`;
	}

	return part;
}

function repairLegacyDistortedName(value: string) {
	return value
		.split(' ')
		.map((word) =>
			word
				.split('-')
				.map((part) => repairLegacyDistortedWordPart(part))
				.join('-')
		)
		.join(' ');
}

function getFinalName(value: string | null) {
	if (!value) return undefined;
	const repaired = repairLegacyDistortedName(value);
	if (repaired === value) return undefined;
	return repaired;
}

async function repairApplicantNames(
	shouldApply: boolean
): Promise<RepairSummary> {
	const rows = await db
		.select({ id: applicants.id, fullName: applicants.fullName })
		.from(applicants);

	const updates: { id: string; fullName: string }[] = [];
	const preview: ChangePreview[] = [];

	for (const row of rows) {
		const nextName = getFinalName(row.fullName);
		if (!nextName || nextName === row.fullName) continue;
		updates.push({ id: row.id, fullName: nextName });
		if (preview.length < 15 && row.fullName) {
			preview.push({ key: row.id, before: row.fullName, after: nextName });
		}
	}

	if (shouldApply && updates.length > 0) {
		await db.execute(sql`
			UPDATE ${applicants} AS target
			SET full_name = source.full_name
			FROM (VALUES ${sql.join(
				updates.map((row) => sql`(${row.id}, ${row.fullName})`),
				sql`, `
			)}) AS source(id, full_name)
			WHERE target.id = source.id
		`);
	}

	return {
		inspected: rows.length,
		updated: updates.length,
		preview,
	};
}

async function repairGuardianNames(
	shouldApply: boolean
): Promise<RepairSummary> {
	const rows = await db
		.select({ id: guardians.id, name: guardians.name })
		.from(guardians);

	const updates: { id: string; name: string }[] = [];
	const preview: ChangePreview[] = [];

	for (const row of rows) {
		const nextName = getFinalName(row.name);
		if (!nextName || nextName === row.name) continue;
		updates.push({ id: row.id, name: nextName });
		if (preview.length < 15 && row.name) {
			preview.push({ key: row.id, before: row.name, after: nextName });
		}
	}

	if (shouldApply && updates.length > 0) {
		await db.execute(sql`
			UPDATE ${guardians} AS target
			SET name = source.name
			FROM (VALUES ${sql.join(
				updates.map((row) => sql`(${row.id}, ${row.name})`),
				sql`, `
			)}) AS source(id, name)
			WHERE target.id = source.id
		`);
	}

	return {
		inspected: rows.length,
		updated: updates.length,
		preview,
	};
}

async function repairEmployeeNames(
	shouldApply: boolean
): Promise<RepairSummary> {
	const rows = await db
		.select({ empNo: employees.empNo, name: employees.name })
		.from(employees);

	const updates: { empNo: string; name: string }[] = [];
	const preview: ChangePreview[] = [];

	for (const row of rows) {
		const nextName = getFinalName(row.name);
		if (!nextName || nextName === row.name) continue;
		updates.push({ empNo: row.empNo, name: nextName });
		if (preview.length < 15 && row.name) {
			preview.push({ key: row.empNo, before: row.name, after: nextName });
		}
	}

	if (shouldApply && updates.length > 0) {
		await db.execute(sql`
			UPDATE ${employees} AS target
			SET name = source.name
			FROM (VALUES ${sql.join(
				updates.map((row) => sql`(${row.empNo}, ${row.name})`),
				sql`, `
			)}) AS source(emp_no, name)
			WHERE target.emp_no = source.emp_no
		`);
	}

	return {
		inspected: rows.length,
		updated: updates.length,
		preview,
	};
}

async function repairStudentNames(
	shouldApply: boolean
): Promise<RepairSummary> {
	const rows = await db
		.select({ stdNo: students.stdNo, name: students.name })
		.from(students);

	const updates: { stdNo: number; name: string }[] = [];
	const preview: ChangePreview[] = [];

	for (const row of rows) {
		const nextName = getFinalName(row.name);
		if (!nextName || nextName === row.name) continue;
		updates.push({ stdNo: row.stdNo, name: nextName });
		if (preview.length < 15 && row.name) {
			preview.push({
				key: String(row.stdNo),
				before: row.name,
				after: nextName,
			});
		}
	}

	if (shouldApply && updates.length > 0) {
		await db.execute(sql`
			UPDATE ${students} AS target
			SET name = source.name
			FROM (VALUES ${sql.join(
				updates.map((row) => sql`(${row.stdNo}, ${row.name})`),
				sql`, `
			)}) AS source(std_no, name)
			WHERE target.std_no = source.std_no
		`);
	}

	return {
		inspected: rows.length,
		updated: updates.length,
		preview,
	};
}

function printPreview(label: string, preview: ChangePreview[]) {
	if (preview.length === 0) return;
	console.log(`\n${label} preview:`);
	for (const row of preview) {
		console.log(`- ${row.key}: ${row.before} -> ${row.after}`);
	}
}

async function main() {
	const shouldApply = process.argv.includes('--apply');

	const [applicantsResult, guardiansResult, employeesResult, studentsResult] =
		await Promise.all([
			repairApplicantNames(shouldApply),
			repairGuardianNames(shouldApply),
			repairEmployeeNames(shouldApply),
			repairStudentNames(shouldApply),
		]);

	console.log(
		[
			`Mode: ${shouldApply ? 'apply' : 'dry-run'}`,
			`Applicants inspected: ${applicantsResult.inspected}`,
			`Applicants updates: ${applicantsResult.updated}`,
			`Guardians inspected: ${guardiansResult.inspected}`,
			`Guardians updates: ${guardiansResult.updated}`,
			`Employees inspected: ${employeesResult.inspected}`,
			`Employees updates: ${employeesResult.updated}`,
			`Students inspected: ${studentsResult.inspected}`,
			`Students updates: ${studentsResult.updated}`,
		].join('\n')
	);

	printPreview('Applicants', applicantsResult.preview);
	printPreview('Guardians', guardiansResult.preview);
	printPreview('Employees', employeesResult.preview);
	printPreview('Students', studentsResult.preview);
}

main().catch((error) => {
	console.error('Failed to repair distorted person names:', error);
	process.exit(1);
});
