'use server';

import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { auth } from '@/core/auth';
import { db, fines, loans, paymentReceipts } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { calculateFine } from '../_lib/calculations';
import type { FineStatus } from '../_lib/types';
import { finesService } from './service';

export const getFine = createAction(async (id: string) => {
	return finesService.getWithRelations(id);
});

export const getFines = createAction(
	async (page: number = 1, search: string = '', status?: FineStatus) => {
		return finesService.getFines(page, search, status);
	}
);

export const getStudentFines = createAction(async (stdNo: number) => {
	return finesService.findByStudent(stdNo);
});

export const getUnpaidFines = createAction(async () => {
	return finesService.findByStatus('Unpaid');
});

export const createFineForLoan = createAction(async (loanId: string) => {
	const loan = await db.query.loans.findFirst({
		where: eq(loans.id, loanId),
	});

	if (!loan) throw new Error('Loan not found');
	if (!loan.returnDate) throw new Error('Loan has not been returned');

	const { amount, daysOverdue } = calculateFine(loan.dueDate, loan.returnDate);

	if (amount <= 0) return null;

	return finesService.createFine(loanId, loan.stdNo, amount, daysOverdue);
});

export const payFine = createAction(async (id: string) => {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');

	const fine = await finesService.getWithRelations(id);
	if (!fine) throw new Error('Fine not found');
	if (fine.status === 'Paid') throw new Error('Fine already paid');

	return db.transaction(async (tx) => {
		const receiptNo = `LF-${Date.now()}-${nanoid(4)}`;

		const [receipt] = await tx
			.insert(paymentReceipts)
			.values({
				receiptNo,
				receiptType: 'library_fine',
				stdNo: fine.stdNo,
				createdBy: session.user?.id,
			})
			.returning();

		const [updated] = await tx
			.update(fines)
			.set({
				status: 'Paid',
				receiptId: receipt.id,
				paidAt: new Date(),
			})
			.where(eq(fines.id, id))
			.returning();

		return { fine: updated, receipt };
	});
});

export const getTotalUnpaidByStudent = createAction(async (stdNo: number) => {
	return finesService.getTotalUnpaidByStudent(stdNo);
});
