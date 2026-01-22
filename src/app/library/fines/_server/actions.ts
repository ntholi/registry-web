'use server';

import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { auth } from '@/core/auth';
import { db, fines, loans, paymentReceipts } from '@/core/database';
import { calculateFine } from '../_lib/calculations';
import type { FineStatus } from '../_lib/types';
import { finesService } from './service';

export async function getFine(id: string) {
	return finesService.getWithRelations(id);
}

export async function getFines(page = 1, search = '', status?: FineStatus) {
	return finesService.getFines(page, search, status);
}

export async function getStudentFines(stdNo: number) {
	return finesService.findByStudent(stdNo);
}

export async function getUnpaidFines() {
	return finesService.findByStatus('Unpaid');
}

export async function createFineForLoan(loanId: string) {
	const loan = await db.query.loans.findFirst({
		where: eq(loans.id, loanId),
	});

	if (!loan) throw new Error('Loan not found');
	if (!loan.returnDate) throw new Error('Loan has not been returned');

	const { amount, daysOverdue } = calculateFine(loan.dueDate, loan.returnDate);

	if (amount <= 0) return null;

	return finesService.createFine(loanId, loan.stdNo, amount, daysOverdue);
}

export async function payFine(id: string) {
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
}

export async function getTotalUnpaidByStudent(stdNo: number) {
	return finesService.getTotalUnpaidByStudent(stdNo);
}
