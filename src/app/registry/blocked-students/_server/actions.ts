'use server';

import { eq } from 'drizzle-orm/sql/expressions/conditions';
import { blockedStudents } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { blockedStudentsService as service } from './service';

type BlockedStudent = typeof blockedStudents.$inferInsert;

export const getBlockedStudent = createAction(async (id: number) =>
	service.get(id)
);

export const getBlockedStudentByStdNo = createAction(async (stdNo: number) => {
	const blockedStudent = await service.getByStdNo(stdNo);
	if (!blockedStudent) return null;
	return blockedStudent;
});

export const createBlockedStudent = createAction(
	async (blockedStudent: BlockedStudent) => service.create(blockedStudent)
);

export const updateBlockedStudent = createAction(
	async (id: number, blockedStudent: Partial<BlockedStudent>) =>
		service.update(id, blockedStudent)
);

export const deleteBlockedStudent = createAction(async (id: number) =>
	service.delete(id)
);

export const getBlockedStudentByStatus = createAction(
	async (
		status: 'blocked' | 'unblocked' = 'blocked',
		page: number = 1,
		search: string = ''
	) =>
		service.getAll({
			filter: eq(blockedStudents.status, status),
			searchColumns: ['stdNo'],
			page,
			search,
		})
);

export const bulkCreateBlockedStudents = createAction(
	async (data: { stdNo: number; reason: string }[], department?: string) =>
		service.bulkCreate(data, department)
);
