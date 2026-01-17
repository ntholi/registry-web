import { relations } from 'drizzle-orm';
import { applications } from '@/core/database';
import { intakePeriods } from './intakePeriods';

export const intakePeriodsRelations = relations(intakePeriods, ({ many }) => ({
	applications: many(applications),
}));
