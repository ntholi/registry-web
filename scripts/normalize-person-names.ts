import '../src/core/database/env-load';
import { eq } from 'drizzle-orm';
import {
	applicants,
	db,
	employees,
	guardians,
	students,
} from '@/core/database';
import { formatPersonName } from '@/shared/lib/utils/utils';

async function normalizeApplicantNames() {
	const rows = await db
		.select({ id: applicants.id, fullName: applicants.fullName })
		.from(applicants);

	let updated = 0;
	for (const row of rows) {
		const fullName = formatPersonName(row.fullName);
		if (!fullName || fullName === row.fullName) continue;
		await db
			.update(applicants)
			.set({ fullName })
			.where(eq(applicants.id, row.id));
		updated++;
	}
	return updated;
}

async function normalizeGuardianNames() {
	const rows = await db
		.select({ id: guardians.id, name: guardians.name })
		.from(guardians);

	let updated = 0;
	for (const row of rows) {
		const name = formatPersonName(row.name);
		if (!name || name === row.name) continue;
		await db.update(guardians).set({ name }).where(eq(guardians.id, row.id));
		updated++;
	}
	return updated;
}

async function normalizeEmployeeNames() {
	const rows = await db
		.select({ empNo: employees.empNo, name: employees.name })
		.from(employees);

	let updated = 0;
	for (const row of rows) {
		const name = formatPersonName(row.name);
		if (!name || name === row.name) continue;
		await db
			.update(employees)
			.set({ name })
			.where(eq(employees.empNo, row.empNo));
		updated++;
	}
	return updated;
}

async function normalizeStudentNames() {
	const rows = await db
		.select({ stdNo: students.stdNo, name: students.name })
		.from(students);

	let updated = 0;
	for (const row of rows) {
		const name = formatPersonName(row.name);
		if (!name || name === row.name) continue;
		await db
			.update(students)
			.set({ name })
			.where(eq(students.stdNo, row.stdNo));
		updated++;
	}
	return updated;
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
