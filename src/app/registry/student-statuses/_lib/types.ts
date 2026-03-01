import type { studentStatusApprovals, studentStatuses } from '@/core/database';

export type StudentStatus = typeof studentStatuses.$inferSelect;
export type StudentStatusInsert = typeof studentStatuses.$inferInsert;
export type StudentStatusApproval = typeof studentStatusApprovals.$inferSelect;
export type StudentStatusType =
	(typeof studentStatuses.type.enumValues)[number];
export type StudentStatusState =
	(typeof studentStatuses.status.enumValues)[number];
export type StudentStatusJustification =
	(typeof studentStatuses.justification.enumValues)[number];
export type StudentStatusApprovalRole =
	(typeof studentStatusApprovals.approverRole.enumValues)[number];
export type StudentStatusApprovalState =
	(typeof studentStatusApprovals.status.enumValues)[number];

export interface StudentStatusEditableInput {
	termCode: string;
	justification: StudentStatusJustification;
	notes?: string | null;
}
