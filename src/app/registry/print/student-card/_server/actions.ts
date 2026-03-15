'use server';

import type { studentCardPrints } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { studentCardPrintsService as service } from './service';

type StudentCardPrint = typeof studentCardPrints.$inferInsert;

interface CreateStudentCardPrintData {
	stdNo: number;
	printedBy: string;
	receiptNo: string;
}

export const createStudentCardPrint = createAction(
	async (studentCardPrint: StudentCardPrint) => service.create(studentCardPrint)
);

export const createStudentCardPrintWithReceipt = createAction(
	async (data: CreateStudentCardPrintData) => service.createWithReceipt(data)
);

export const getStudentCardPrints = createAction(async (stdNo: number) =>
	service.findByStdNo(stdNo)
);
