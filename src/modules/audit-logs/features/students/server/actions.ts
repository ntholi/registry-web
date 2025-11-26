'use server';

import { revalidatePath } from 'next/cache';
import type { studentAuditLogs, students } from '@/core/database';
import { studentAuditLogService as service } from './service';

type StudentAuditLog = typeof studentAuditLogs.$inferInsert;
type StudentUpdate = Partial<typeof students.$inferInsert>;

export async function getAuditLog(id: number) {
	return service.get(id);
}

export async function findAllAuditLogs(page: number = 1, search = '') {
	return service.findAll({
		page,
		search,
		searchColumns: ['stdNo'],
	});
}

export async function createAuditLog(record: StudentAuditLog) {
	return service.create(record);
}

export async function updateStudent(
	stdNo: number,
	updates: StudentUpdate,
	reasons?: string
) {
	const result = await service.updateStudent(stdNo, updates, reasons);
	revalidatePath(`/registry/students/${stdNo}`);
	return result;
}
