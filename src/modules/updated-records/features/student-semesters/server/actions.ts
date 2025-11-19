'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/core/auth';
import {
	db,
	structureSemesters,
	studentSemesterSyncRecords,
	studentSemesters,
} from '@/core/database';
import withAuth from '@/core/platform/withAuth';
import { studentSemesterSyncService as service } from './service';

type StudentSemesterSyncRecord = typeof studentSemesterSyncRecords.$inferInsert;
type StudentSemesterUpdate = Partial<typeof studentSemesters.$inferInsert>;

export async function getSyncRecord(id: number) {
	return service.get(id);
}

export async function findAllSyncRecords(page: number = 1, search = '') {
	return service.findAll({
		page,
		search,
		searchColumns: ['studentSemesterId'],
	});
}

export async function createSyncRecord(record: StudentSemesterSyncRecord) {
	return service.create(record);
}

export async function getAllSponsors() {
	return withAuth(async () => {
		return db.query.sponsors.findMany({
			columns: { id: true, name: true, code: true },
			orderBy: (sponsors, { asc }) => [asc(sponsors.name)],
		});
	}, ['registry', 'admin', 'finance']);
}

export async function getStructureSemestersByStructureId(structureId: number) {
	return withAuth(async () => {
		return db.query.structureSemesters.findMany({
			where: eq(structureSemesters.structureId, structureId),
			columns: { id: true, name: true, semesterNumber: true },
			orderBy: (sems, { asc }) => [asc(sems.semesterNumber)],
		});
	}, ['registry', 'admin']);
}

export async function updateStudentSemester(
	studentSemesterId: number,
	updates: StudentSemesterUpdate,
	reasons?: string
) {
	return withAuth(async () => {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		const oldRecord = await db.query.studentSemesters.findFirst({
			where: eq(studentSemesters.id, studentSemesterId),
		});

		if (!oldRecord) {
			throw new Error('Student semester not found');
		}

		const [updatedRecord] = await db
			.update(studentSemesters)
			.set(updates)
			.where(eq(studentSemesters.id, studentSemesterId))
			.returning();

		await db.insert(studentSemesterSyncRecords).values({
			studentSemesterId,
			oldValues: oldRecord as unknown as Record<string, unknown>,
			newValues: updatedRecord as unknown as Record<string, unknown>,
			reasons: reasons || null,
			updatedBy: session.user.id,
		});

		revalidatePath('/dashboard/students');

		return updatedRecord;
	}, ['registry', 'admin']);
}
