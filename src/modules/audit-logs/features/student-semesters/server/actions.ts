'use server';

import { revalidatePath } from 'next/cache';
import type {
	studentSemesterAuditLogs,
	studentSemesters,
} from '@/core/database';
import { studentSemesterSyncService as service } from './service';

type StudentSemesterSyncRecord = typeof studentSemesterAuditLogs.$inferInsert;
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

export async function getStructureSemestersByStructureId(structureId: number) {
	return service.getStructureSemestersByStructureId(structureId);
}

export async function updateStudentSemester(
	studentSemesterId: number,
	updates: StudentSemesterUpdate,
	reasons?: string
) {
	const result = await service.updateStudentSemester(
		studentSemesterId,
		updates,
		reasons
	);
	revalidatePath('/dashboard/students');
	return result;
}
