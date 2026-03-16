'use server';

import { eq } from 'drizzle-orm/sql/expressions/conditions';
import { blockedStudents } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { blockedStudentsService as service } from './service';

type BlockedStudent = typeof blockedStudents.$inferInsert;

export async function getBlockedStudent(id: number) {
	return service.get(id);
}

export async function getBlockedStudentByStdNo(stdNo: number) {
	const blockedStudent = await service.getByStdNo(stdNo);
	if (!blockedStudent) return null;
	return blockedStudent;
}

export const createBlockedStudent = createAction(
	async (blockedStudent: BlockedStudent) => {
		return service.create(blockedStudent);
	}
);

export const updateBlockedStudent = createAction(
	async (id: number, blockedStudent: Partial<BlockedStudent>) => {
		return service.update(id, blockedStudent);
	}
);

export const deleteBlockedStudent = createAction(async (id: number) => {
	return service.delete(id);
});

export async function getBlockedStudentByStatus(
	status: 'blocked' | 'unblocked' = 'blocked',
	page: number = 1,
	search = ''
) {
	return service.getAll({
		filter: eq(blockedStudents.status, status),
		searchColumns: ['stdNo'],
		page,
		search,
	});
}

export const bulkCreateBlockedStudents = createAction(
	async (data: { stdNo: number; reason: string }[], department?: string) => {
		return service.bulkCreate(data, department);
	}
);
