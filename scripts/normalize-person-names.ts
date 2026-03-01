import '../src/core/database/env-load';
import { eq } from 'drizzle-orm';
import {
	applicants,
	db,
	employees,
	guardians,
	students,
} from '@/core/database';
import { formatPersonName } from '@/shared/lib/utils/names';

async function normalizeApplicantNames() {
	const rows = await db
		.select({ id: applicants.id, fullName: applicants.fullName })
		.from(applicants);

	const updates: { id: string; fullName: string }[] = [];
	for (const row of rows) {
		const fullName = formatPersonName(row.fullName);
		if (!fullName || fullName === row.fullName) continue;
		updates.push({ id: row.id, fullName });
	}

	if (updates.length === 0) return 0;

	await db.transaction(async (tx) => {
		for (const row of updates) {
			await tx
				.update(applicants)
				.set({ fullName: row.fullName })
				.where(eq(applicants.id, row.id));
		}
	});

	return updates.length;
}

async function normalizeGuardianNames() {
	const rows = await db
		.select({ id: guardians.id, name: guardians.name })
		.from(guardians);

	const updates: { id: string; name: string }[] = [];
	for (const row of rows) {
		const name = formatPersonName(row.name);
		if (!name || name === row.name) continue;
		updates.push({ id: row.id, name });
	}

	if (updates.length === 0) return 0;

	await db.transaction(async (tx) => {
		for (const row of updates) {
			await tx
				.update(guardians)
				.set({ name: row.name })
				.where(eq(guardians.id, row.id));
		}
	});

	return updates.length;
}

async function normalizeEmployeeNames() {
	const rows = await db
		.select({ empNo: employees.empNo, name: employees.name })
		.from(employees);

	const updates: { empNo: string; name: string }[] = [];
	for (const row of rows) {
		const name = formatPersonName(row.name);
		if (!name || name === row.name) continue;
		updates.push({ empNo: row.empNo, name });
	}

	if (updates.length === 0) return 0;

	await db.transaction(async (tx) => {
		for (const row of updates) {
			await tx
				.update(employees)
				.set({ name: row.name })
				.where(eq(employees.empNo, row.empNo));
		}
	});

	return updates.length;
}

async function normalizeStudentNames() {
	const rows = await db
		.select({ stdNo: students.stdNo, name: students.name })
		.from(students);

	const updates: { stdNo: number; name: string }[] = [];
	for (const row of rows) {
		const name = formatPersonName(row.name);
		if (!name || name === row.name) continue;
		updates.push({ stdNo: row.stdNo, name });
	}

	if (updates.length === 0) return 0;

	await db.transaction(async (tx) => {
		for (const row of updates) {
			await tx
				.update(students)
				.set({ name: row.name })
				.where(eq(students.stdNo, row.stdNo));
		}
	});

	return updates.length;
}

async function main() {
	const [applicantCount, guardianCount, employeeCount, studentCount] =
		await Promise.all([
			normalizeApplicantNames(),
			normalizeGuardianNames(),
			normalizeEmployeeNames(),
			normalizeStudentNames(),
		]);

	console.log(
		[
			`Applicants updated: ${applicantCount}`,
			`Guardians updated: ${guardianCount}`,
			`Employees updated: ${employeeCount}`,
			`Students updated: ${studentCount}`,
		].join('\n')
	);
}

main().catch((error) => {
	console.error('Failed to normalize person names:', error);
	process.exit(1);
});
