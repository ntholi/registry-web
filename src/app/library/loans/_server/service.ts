import type { loans } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { LoanFilters } from '../_lib/types';
import LoanRepository from './repository';

class LoanService extends BaseService<typeof loans, 'id'> {
	declare repository: LoanRepository;

	constructor() {
		super(new LoanRepository(), {
			byIdAuth: { library: ['read'] },
			findAllAuth: { library: ['read'] },
			createAuth: { library: ['create'] },
			updateAuth: { library: ['update'] },
			deleteAuth: { library: ['delete'] },
			activityTypes: {
				delete: 'loan_deleted',
			},
		});
	}

	async getWithRelations(id: string) {
		return withPermission(() => this.repository.findByIdWithRelations(id), {
			library: ['read'],
		});
	}

	async findByStudent(stdNo: number, status?: string) {
		return withPermission(() => this.repository.findByStudent(stdNo, status), {
			library: ['read'],
		});
	}

	async findActiveLoans() {
		return withPermission(() => this.repository.findActiveLoans(), {
			library: ['read'],
		});
	}

	async findOverdueLoans() {
		return withPermission(() => this.repository.findOverdueLoans(), {
			library: ['read'],
		});
	}

	async issueLoan(
		bookCopyId: string,
		stdNo: number,
		dueDate: Date,
		issuedBy: string
	) {
		return withPermission(
			() =>
				this.repository.createLoan(
					{ bookCopyId, stdNo, dueDate, issuedBy },
					{ userId: issuedBy, activityType: 'book_loan_created', stdNo }
				),
			{ library: ['create'] }
		);
	}

	async returnBook(loanId: string, returnedTo: string) {
		return withPermission(
			() =>
				this.repository.processReturn(loanId, returnedTo, {
					userId: returnedTo,
					activityType: 'book_returned',
				}),
			{ library: ['update'] }
		);
	}

	async renewLoan(loanId: string, newDueDate: Date, renewedBy: string) {
		return withPermission(
			() =>
				this.repository.renewLoan(loanId, newDueDate, renewedBy, {
					userId: renewedBy,
					activityType: 'book_loan_renewed',
				}),
			{ library: ['update'] }
		);
	}

	async getLoanHistory(page: number, search: string, filters?: LoanFilters) {
		return withPermission(
			() => this.repository.getLoanHistory(page, search, filters),
			{ library: ['read'] }
		);
	}

	async searchStudents(query: string) {
		return withPermission(() => this.repository.searchStudents(query), {
			library: ['read'],
		});
	}

	async searchBooks(query: string) {
		return withPermission(() => this.repository.searchBooks(query), {
			library: ['read'],
		});
	}

	async getAvailableCopies(bookId: string) {
		return withPermission(() => this.repository.getAvailableCopies(bookId), {
			library: ['read'],
		});
	}

	async getStudentActiveLoansCount(stdNo: number) {
		return withPermission(
			() => this.repository.getStudentActiveLoansCount(stdNo),
			{ library: ['read'] }
		);
	}
}

export const loansService = serviceWrapper(LoanService, 'LoanService');
