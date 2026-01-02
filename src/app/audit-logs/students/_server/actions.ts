'use server';

import { revalidatePath } from 'next/cache';
import type { students } from '@/core/database';
import { studentAuditLogService as service } from './service';

type StudentUpdate = Partial<typeof students.$inferInsert>;

export async function updateStudent(
	stdNo: number,
	updates: StudentUpdate,
	reasons?: string
) {
	const result = await service.updateStudent(stdNo, updates, reasons);
	revalidatePath(`/registry/students/${stdNo}`);
	return result;
}

export async function getStudentAuditHistory(stdNo: number) {
	return service.getHistoryByStudentId(stdNo);
}
