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

export interface GroupedPaymentReviewItem {
	id: string;
	status: DepositStatus;
	reference: string | null;
	amountDeposited: string;
	documentsCount: number;
	applicationId: string | null;
	applicantId: string | null;
	applicantName: string | null;
	createdAt: Date | null;
}

export interface GroupedPaymentReviewDeposit extends BankDeposit {
	document: {
		id: string;
		fileName: string | null;
		fileUrl: string | null;
		type: string | null;
		createdAt: Date | null;
	} | null;
	receipt: {
		id: string;
		receiptNo: string | null;
		createdBy: string | null;
		createdAt: Date | null;
		createdByUser: {
			id: string;
			name: string | null;
		} | null;
	} | null;
}

export interface GroupedPaymentReviewDetail {
	application: {
		id: string;
		status: string;
		paymentStatus: string;
		applicant: {
			id: string;
			fullName: string | null;
			nationalId: string | null;
			nationality: string | null;
		} | null;
		intakePeriod: {
			id: string;
			name: string | null;
			localApplicationFee: string | null;
			internationalApplicationFee: string | null;
		} | null;
	} | null;
	deposits: GroupedPaymentReviewDeposit[];
}
