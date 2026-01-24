import type { paymentTransactions } from '@admissions/_database';

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type PaymentTransactionInsert = typeof paymentTransactions.$inferInsert;

export type TransactionStatus = 'pending' | 'success' | 'failed';
export type PaymentProvider = 'mpesa' | 'ecocash';

export interface PaymentFilters {
	status?: TransactionStatus;
	provider?: PaymentProvider;
	applicationId?: string;
}

export interface PaymentWithRelations extends PaymentTransaction {
	application: {
		id: string;
		applicant: {
			id: string;
			fullName: string;
		};
	} | null;
	markedPaidByUser: {
		id: string;
		name: string | null;
	} | null;
}

export interface InitiatePaymentInput {
	applicationId: string;
	amount: number;
	mobileNumber: string;
	provider: PaymentProvider;
}
