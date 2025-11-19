'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/core/auth';
import { db, studentModuleAuditLogs, studentModules } from '@/core/database';
import withAuth from '@/core/platform/withAuth';
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

export async function updateStudentModule(
	studentModuleId: number,
	updates: StudentModuleUpdate,
	reasons?: string
) {
	return withAuth(async () => {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		const oldRecord = await db.query.studentModules.findFirst({
			where: eq(studentModules.id, studentModuleId),
		});

		if (!oldRecord) {
			throw new Error('Student module not found');
		}

		const [updatedRecord] = await db
			.update(studentModules)
			.set(updates)
			.where(eq(studentModules.id, studentModuleId))
			.returning();

		await db.insert(studentModuleAuditLogs).values({
			studentModuleId,
			oldValues: oldRecord as unknown as Record<string, unknown>,
			newValues: updatedRecord as unknown as Record<string, unknown>,
			reasons: reasons || null,
			updatedBy: session.user.id,
		});

		revalidatePath('/dashboard/students');

		return updatedRecord;
	}, ['registry', 'admin']);
}
