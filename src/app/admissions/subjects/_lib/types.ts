import type { subjects } from '@/core/database';

export type Subject = typeof subjects.$inferSelect;
export type SubjectInsert = typeof subjects.$inferInsert;
