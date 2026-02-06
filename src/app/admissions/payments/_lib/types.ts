import type {
	admissionReceipts,
	bankDeposits,
	DepositStatus,
	mobileDeposits,
} from '@admissions/_database';

export type BankDeposit = typeof bankDeposits.$inferSelect;
export type BankDepositInsert = typeof bankDeposits.$inferInsert;

export type MobileDeposit = typeof mobileDeposits.$inferSelect;
export type MobileDepositInsert = typeof mobileDeposits.$inferInsert;

export type AdmissionReceipt = typeof admissionReceipts.$inferSelect;
export type AdmissionReceiptInsert = typeof admissionReceipts.$inferInsert;

export type { DepositStatus };
export type MobileProvider = 'mpesa' | 'ecocash';

export interface DepositFilters {
	status?: DepositStatus;
	applicationId?: string;
}

export interface BankDepositWithRelations extends BankDeposit {
	application: {
		id: string;
		applicant: {
			id: string;
			fullName: string;
		};
	} | null;
	receipt: AdmissionReceipt | null;
}
