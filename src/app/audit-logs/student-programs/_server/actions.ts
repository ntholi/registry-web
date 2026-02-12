'use server';

import { revalidatePath } from 'next/cache';
import type { studentPrograms } from '@/core/database';
import { studentProgramAuditService as service } from './service';

type StudentProgramUpdate = Partial<typeof studentPrograms.$inferInsert>;
type StudentProgramCreate = typeof studentPrograms.$inferInsert;

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

export async function createStudentProgram(
	program: StudentProgramCreate,
	reasons?: string
) {
	const result = await service.createStudentProgram(program, reasons);
	revalidatePath('/dashboard/students');
	return result;
}

export async function getStudentProgramAuditHistory(studentProgramId: number) {
	return service.getHistoryByStudentProgramId(studentProgramId);
}
