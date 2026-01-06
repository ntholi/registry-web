'use server';

import { revalidatePath } from 'next/cache';
import type { studentSemesters } from '@/core/database';
import { studentSemesterSyncService as service } from './service';

type StudentSemesterUpdate = Partial<typeof studentSemesters.$inferInsert>;

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

export async function getStudentSemesterAuditHistory(
	studentSemesterId: number
) {
	return service.getHistoryByStudentSemesterId(studentSemesterId);
}
