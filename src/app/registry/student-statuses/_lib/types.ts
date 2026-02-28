import type { studentStatusApprovals, studentStatuses } from '@/core/database';

export type StudentStatus = typeof studentStatuses.$inferSelect;
export type StudentStatusInsert = typeof studentStatuses.$inferInsert;
export type StudentStatusApproval = typeof studentStatusApprovals.$inferSelect;
