'use server';

import { revalidatePath } from 'next/cache';
import type { studentProgramAuditLogs, studentPrograms } from '@/core/database';
import { studentProgramAuditService as service } from './service';

type StudentProgramAuditRecord = typeof studentProgramAuditLogs.$inferInsert;
type StudentProgramUpdate = Partial<typeof studentPrograms.$inferInsert>;

export async function getAuditRecord(id: number) {
	return service.get(id);
}

export async function findAllAuditRecords(page: number = 1, search = '') {
	return service.findAll({
		page,
		search,
		searchColumns: ['studentProgramId'],
	});
}

export async function createAuditRecord(record: StudentProgramAuditRecord) {
	return service.create(record);
}

export async function getStructures() {
	return service.getStructures();
}

export async function updateStudentProgram(
	studentProgramId: number,
	updates: StudentProgramUpdate,
	reasons?: string
) {
	const result = await service.updateStudentProgram(
		studentProgramId,
		updates,
		reasons
	);
	revalidatePath('/dashboard/students');
	return result;
}
