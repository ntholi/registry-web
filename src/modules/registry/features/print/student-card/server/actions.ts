'use server';

import type { studentCardPrints } from '@/core/database';
import { studentCardPrintsService as service } from './service';

type StudentCardPrint = typeof studentCardPrints.$inferInsert;

export async function getStudentCardPrint(id: string) {
	return service.get(id);
}

export async function getStudentCardPrints(page: number = 1, search = '') {
	return service.getAll({ page, search });
}

export async function createStudentCardPrint(
	studentCardPrint: StudentCardPrint
) {
	return service.create(studentCardPrint);
}

export async function updateStudentCardPrint(
	id: string,
	studentCardPrint: Partial<StudentCardPrint>
) {
	return service.update(id, studentCardPrint);
}

export async function deleteStudentCardPrint(id: string) {
	return service.delete(id);
}
