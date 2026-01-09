import type { intakePeriods } from '@/core/database';

export type IntakePeriod = typeof intakePeriods.$inferSelect;
export type IntakePeriodInsert = typeof intakePeriods.$inferInsert;
