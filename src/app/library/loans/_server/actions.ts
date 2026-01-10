'use server';

import { auth } from '@/core/auth';
import { createFineForLoan } from '../../fines/_server/actions';
import type { LoanFilters } from '../_lib/types';
import { loansService } from './service';

export async function getLoan(id: number) {
	return loansService.getWithRelations(id);
}

export async function getLoans(page = 1, search = '', filters?: LoanFilters) {
	return loansService.getLoanHistory(page, search, filters);
}

export async function getActiveLoans() {
	return loansService.findActiveLoans();
}

export async function getOverdueLoans() {
	return loansService.findOverdueLoans();
}

export async function getStudentLoans(stdNo: number, status?: string) {
	return loansService.findByStudent(stdNo, status);
}

export async function createLoan(
	bookCopyId: number,
	stdNo: number,
	dueDate: Date
) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');
	return loansService.issueLoan(bookCopyId, stdNo, dueDate, session.user.id);
}

export async function returnLoan(id: number) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');

	const result = await loansService.returnBook(id, session.user.id);

	if (result.daysOverdue && result.daysOverdue > 0) {
		await createFineForLoan(id);
	}

	return result;
}

export async function renewLoan(id: number, newDueDate: Date) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');
	return loansService.renewLoan(id, newDueDate, session.user.id);
}

export async function searchStudents(query: string) {
	if (!query || query.length < 2) return [];
	return loansService.searchStudents(query);
}

export async function searchBooks(query: string) {
	if (!query || query.length < 2) return [];
	return loansService.searchBooks(query);
}

export async function getAvailableCopies(bookId: number) {
	return loansService.getAvailableCopies(bookId);
}

export async function deleteLoan(id: number) {
	return loansService.delete(id);
}
