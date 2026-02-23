import type {
	ApplicationStatus,
	admissionReceipts,
	applicationNotes,
	applicationScores,
	applicationStatusHistory,
	applications,
	bankDeposits,
	mobileDeposits,
	PaymentStatus,
} from '@/core/database';

export type Application = typeof applications.$inferSelect;
export type ApplicationInsert = typeof applications.$inferInsert;

export type ApplicationNote = typeof applicationNotes.$inferSelect;
export type ApplicationNoteInsert = typeof applicationNotes.$inferInsert;

export type ApplicationScore = typeof applicationScores.$inferSelect;

export type BankDeposit = typeof bankDeposits.$inferSelect;
export type MobileDeposit = typeof mobileDeposits.$inferSelect;
export type AdmissionReceipt = typeof admissionReceipts.$inferSelect;

export type ApplicationStatusHistoryEntry =
	typeof applicationStatusHistory.$inferSelect;

export type ApplicationWithRelations = Application & {
	applicant: {
		id: string;
		fullName: string;
		nationalId: string | null;
		nationality: string | null;
	};
	intakePeriod: {
		id: string;
		name: string;
		localApplicationFee: string;
		internationalApplicationFee: string;
		startDate: string;
		endDate: string;
	};
	firstChoiceProgram: {
		id: number;
		name: string;
		code: string;
	} | null;
	secondChoiceProgram: {
		id: number;
		name: string;
		code: string;
	} | null;
	createdByUser: { id: string; name: string | null } | null;
	bankDeposits: (BankDeposit & {
		receipt: { id: string; receiptNo: string; createdAt: Date | null } | null;
	})[];
	mobileDeposits: (MobileDeposit & {
		receipt: { id: string; receiptNo: string; createdAt: Date | null } | null;
	})[];
	statusHistory: (ApplicationStatusHistoryEntry & {
		changedByUser: { id: string; name: string | null } | null;
	})[];
	notes: (ApplicationNote & {
		createdByUser: { id: string; name: string | null } | null;
	})[];
	scores: ApplicationScore | null;
};

export type ApplicationFilters = {
	status?: ApplicationStatus;
	paymentStatus?: PaymentStatus;
	intakePeriodId?: string;
};

export type { ApplicationStatus, PaymentStatus };
