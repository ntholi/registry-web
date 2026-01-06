'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/core/auth';
import type { studentModules } from '@/core/database';
import { studentModuleAuditLogService as service } from './service';

type StudentModuleUpdate = Partial<typeof studentModules.$inferInsert>;

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
