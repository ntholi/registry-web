'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/core/auth';
import type { studentModuleAuditLogs, studentModules } from '@/core/database';
import { studentModuleAuditLogService as service } from './service';

type StudentModuleAuditLogRecord = typeof studentModuleAuditLogs.$inferInsert;
type StudentModuleUpdate = Partial<typeof studentModules.$inferInsert>;

export async function getAuditLog(id: number) {
	return service.get(id);
}

export async function findAllAuditLogs(page: number = 1, search = '') {
	return service.findAll({
		page,
		search,
		searchColumns: ['studentModuleId'],
	});
}

export async function createAuditLog(record: StudentModuleAuditLogRecord) {
	return service.create(record);
}

export async function canEditMarksAndGrades() {
	const session = await auth();
	const isAdmin = session?.user?.role === 'admin';
	const isRegistryManager =
		session?.user?.role === 'registry' && session?.user?.position === 'manager';
	return isAdmin || isRegistryManager;
}

export async function updateStudentModule(
	studentModuleId: number,
	updates: StudentModuleUpdate,
	reasons?: string
) {
	const result = await service.updateStudentModule(
		studentModuleId,
		updates,
		reasons
	);
	revalidatePath('/dashboard/students');
	return result;
}

export async function getStudentModuleAuditHistory(studentModuleId: number) {
	return service.getHistoryByStudentModuleId(studentModuleId);
}
