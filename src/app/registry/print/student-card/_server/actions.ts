'use server';

import type { studentCardPrints } from '@/core/database';
import { studentCardPrintsService as service } from './service';

type StudentCardPrint = typeof studentCardPrints.$inferInsert;

interface CreateStudentCardPrintData {
	stdNo: number;
	printedBy: string;
	receiptNo: string;
}

export async function createStudentCardPrint(
	studentCardPrint: StudentCardPrint
) {
	return service.create(studentCardPrint);
}

export async function createStudentCardPrintWithReceipt(
	data: CreateStudentCardPrintData
) {
	return service.createWithReceipt(data);
}
