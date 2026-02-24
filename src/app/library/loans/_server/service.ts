import type { loans } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import type { LoanFilters } from '../_lib/types';
import LoanRepository from './repository';

class LoanService extends BaseService<typeof loans, 'id'> {
	declare repository: LoanRepository;

	constructor() {
		super(new LoanRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
		});
	}

	async getWithRelations(id: string) {
		return this.repository.findByIdWithRelations(id);
	}

	async findByStudent(stdNo: number, status?: string) {
		return this.repository.findByStudent(stdNo, status);
	}

	async findActiveLoans() {
		return this.repository.findActiveLoans();
	}

	async findOverdueLoans() {
		return this.repository.findOverdueLoans();
	}

	async issueLoan(
		bookCopyId: string,
		stdNo: number,
		dueDate: Date,
		issuedBy: string
	) {
		return this.repository.createLoan(
			{ bookCopyId, stdNo, dueDate, issuedBy },
			{ userId: issuedBy }
		);
	}

	async returnBook(loanId: string, returnedTo: string) {
		return this.repository.processReturn(loanId, returnedTo, {
			userId: returnedTo,
		});
	}

	async renewLoan(loanId: string, newDueDate: Date, renewedBy: string) {
		return this.repository.renewLoan(loanId, newDueDate, renewedBy, {
			userId: renewedBy,
		});
	}

	async getLoanHistory(page: number, search: string, filters?: LoanFilters) {
		return this.repository.getLoanHistory(page, search, filters);
	}

	async searchStudents(query: string) {
		return this.repository.searchStudents(query);
	}

	async searchBooks(query: string) {
		return this.repository.searchBooks(query);
	}

	async getAvailableCopies(bookId: string) {
		return this.repository.getAvailableCopies(bookId);
	}

	async getStudentActiveLoansCount(stdNo: number) {
		return this.repository.getStudentActiveLoansCount(stdNo);
	}
}

export const loansService = serviceWrapper(LoanService, 'LoanService');
