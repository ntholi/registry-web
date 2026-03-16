'use server';

import type { studentCardPrints } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { studentCardPrintsService as service } from './service';

type StudentCardPrint = typeof studentCardPrints.$inferInsert;

interface CreateStudentCardPrintData {
	stdNo: number;
	printedBy: string;
	receiptNo: string;
}

export const createStudentCardPrint = createAction(
	async (studentCardPrint: StudentCardPrint) => {
		return service.create(studentCardPrint);
	}
);

export const createStudentCardPrintWithReceipt = createAction(
	async (data: CreateStudentCardPrintData) => {
		return service.createWithReceipt(data);
	}
);

export async function getStudentCardPrints(stdNo: number) {
	return service.findByStdNo(stdNo);
}
