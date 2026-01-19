import type {
	ApplicationStatus,
	applicationNotes,
	applicationReceipts,
	applicationStatusHistory,
	applications,
	PaymentStatus,
} from '@/core/database';

export type Application = typeof applications.$inferSelect;
export type ApplicationInsert = typeof applications.$inferInsert;

export type ApplicationNote = typeof applicationNotes.$inferSelect;
export type ApplicationNoteInsert = typeof applicationNotes.$inferInsert;

export type ApplicationReceipt = typeof applicationReceipts.$inferSelect;
export type ApplicationReceiptInsert = typeof applicationReceipts.$inferInsert;

export type ApplicationStatusHistoryEntry =
	typeof applicationStatusHistory.$inferSelect;

export type ApplicationWithRelations = Application & {
	applicant: {
		id: string;
		fullName: string;
		nationalId: string | null;
	};
	intakePeriod: {
		id: string;
		name: string;
		applicationFee: string;
		startDate: string;
		endDate: string;
	};
	firstChoiceProgram: {
		id: number;
		name: string;
		code: string;
	};
	secondChoiceProgram: {
		id: number;
		name: string;
		code: string;
	} | null;
	createdByUser: { id: string; name: string | null } | null;
	receipts: (ApplicationReceipt & {
		receipt: { id: string; receiptNo: string; createdAt: Date | null };
	})[];
	statusHistory: (ApplicationStatusHistoryEntry & {
		changedByUser: { id: string; name: string | null } | null;
	})[];
	notes: (ApplicationNote & {
		createdByUser: { id: string; name: string | null } | null;
	})[];
};

export type ApplicationFilters = {
	status?: ApplicationStatus;
	paymentStatus?: PaymentStatus;
	intakePeriodId?: string;
};

export type { ApplicationStatus, PaymentStatus };
