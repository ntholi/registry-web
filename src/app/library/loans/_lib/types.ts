import type { loanRenewals, loans } from '@/core/database';

export type Loan = typeof loans.$inferSelect;
export type LoanInsert = typeof loans.$inferInsert;
export type LoanRenewal = typeof loanRenewals.$inferSelect;
export type LoanRenewalInsert = typeof loanRenewals.$inferInsert;

export type LoanStatus = 'Active' | 'Returned' | 'Overdue';

export interface LoanFilters {
	status?: LoanStatus;
	stdNo?: number;
}

export interface LoanWithRelations extends Loan {
	bookCopy: {
		id: number;
		serialNumber: string;
		condition: string;
		location: string | null;
		book: {
			id: number;
			isbn: string;
			title: string;
			coverUrl: string | null;
		};
	};
	student: {
		stdNo: number;
		name: string;
	};
	issuedByUser: {
		id: string;
		name: string | null;
	} | null;
	returnedToUser: {
		id: string;
		name: string | null;
	} | null;
	renewals: LoanRenewal[];
	daysOverdue?: number;
}

export interface StudentSearchResult {
	stdNo: number;
	name: string;
	activeLoansCount: number;
}

export interface BookSearchResult {
	id: number;
	isbn: string;
	title: string;
	coverUrl: string | null;
	availableCopies: number;
}

export interface AvailableCopy {
	id: number;
	serialNumber: string;
	condition: string;
	location: string | null;
}
