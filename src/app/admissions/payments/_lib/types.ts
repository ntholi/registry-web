import type { paymentTransactions } from '@admissions/_database';

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type PaymentTransactionInsert = typeof paymentTransactions.$inferInsert;

export type TransactionStatus = 'pending' | 'success' | 'failed';
export type PaymentProvider = 'mpesa' | 'ecocash';

export interface PaymentFilters {
	status?: TransactionStatus;
	provider?: PaymentProvider;
	applicantId?: string;
}

export interface PaymentWithRelations extends PaymentTransaction {
	applicant: {
		id: string;
		fullName: string;
	};
	markedPaidByUser: {
		id: string;
		name: string | null;
	} | null;
}

export interface InitiatePaymentInput {
	applicantId: string;
	amount: number;
	mobileNumber: string;
	provider: PaymentProvider;
}
