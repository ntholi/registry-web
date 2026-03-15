'use server';

import { auth } from '@/core/auth';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
import { createFineForLoan } from '../../fines/_server/actions';
import type { LoanFilters } from '../_lib/types';
import { loansService } from './service';

export const getLoan = createAction(async (id: string) => {
	return loansService.getWithRelations(id);
});

export const getLoans = createAction(
	async (page: number = 1, search: string = '', filters?: LoanFilters) => {
		return loansService.getLoanHistory(page, search, filters);
	}
);

export const getActiveLoans = createAction(async () => {
	return loansService.findActiveLoans();
});

export const getOverdueLoans = createAction(async () => {
	return loansService.findOverdueLoans();
});

export const getStudentLoans = createAction(
	async (stdNo: number, status?: string) => {
		return loansService.findByStudent(stdNo, status);
	}
);

export const createLoan = createAction(
	async (bookCopyId: string, stdNo: number, dueDate: Date) => {
		const session = await auth();
		if (!session?.user?.id) throw new Error('Unauthorized');
		return loansService.issueLoan(bookCopyId, stdNo, dueDate, session.user.id);
	}
);

export const returnLoan = createAction(async (id: string) => {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');

	const result = await loansService.returnBook(id, session.user.id);

	if (result.daysOverdue && result.daysOverdue > 0) {
		unwrap(await createFineForLoan(id));
	}

	return result;
});

export const renewLoan = createAction(async (id: string, newDueDate: Date) => {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');
	return loansService.renewLoan(id, newDueDate, session.user.id);
});

export const searchStudents = createAction(async (query: string) => {
	if (!query || query.length < 2) return [];
	return loansService.searchStudents(query);
});

export const searchBooks = createAction(async (query: string) => {
	if (!query || query.length < 2) return [];
	return loansService.searchBooks(query);
});

export const getAvailableCopies = createAction(async (bookId: string) => {
	return loansService.getAvailableCopies(bookId);
});

export const deleteLoan = createAction(async (id: string) => {
	return loansService.delete(id);
});
