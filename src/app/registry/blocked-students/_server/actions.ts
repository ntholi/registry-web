'use server';

import { eq } from 'drizzle-orm/sql/expressions/conditions';
import { blockedStudents } from '@/core/database';
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

export async function createBlockedStudent(blockedStudent: BlockedStudent) {
	return service.create(blockedStudent);
}

export async function updateBlockedStudent(
	id: number,
	blockedStudent: Partial<BlockedStudent>
) {
	return service.update(id, blockedStudent);
}

export async function deleteBlockedStudent(id: number) {
	return service.delete(id);
}

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

export async function bulkCreateBlockedStudents(
	data: { stdNo: number; reason: string }[],
	department?: string
) {
	return service.bulkCreate(data, department);
}
