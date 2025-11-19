'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/core/auth';
import { db, studentAuditLogs, students } from '@/core/database';
import withAuth from '@/core/platform/withAuth';
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
	return withAuth(async () => {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		const oldRecord = await db.query.students.findFirst({
			where: eq(students.stdNo, stdNo),
		});

		if (!oldRecord) {
			throw new Error('Student not found');
		}

		const [updatedRecord] = await db
			.update(students)
			.set(updates)
			.where(eq(students.stdNo, stdNo))
			.returning();

		await db.insert(studentAuditLogs).values({
			stdNo,
			oldValues: oldRecord as unknown as Record<string, unknown>,
			newValues: updatedRecord as unknown as Record<string, unknown>,
			operation: 'update',
			reasons: reasons || null,
			updatedBy: session.user.id,
		});

		revalidatePath(`/dashboard/students/${stdNo}`);

		return updatedRecord;
	}, ['registry', 'admin']);
}
