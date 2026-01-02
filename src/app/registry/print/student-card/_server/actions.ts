'use server';

import type { studentCardPrints } from '@/core/database';
import { studentCardPrintsService as service } from './service';

type StudentCardPrint = typeof studentCardPrints.$inferInsert;

export async function createStudentCardPrint(
	studentCardPrint: StudentCardPrint
) {
	return service.create(studentCardPrint);
}
