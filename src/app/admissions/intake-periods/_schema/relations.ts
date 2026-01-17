import { applications } from '@admissions/applications/_schema/applications';
import { relations } from 'drizzle-orm';
import { intakePeriods } from './intakePeriods';

export const intakePeriodsRelations = relations(intakePeriods, ({ many }) => ({
	applications: many(applications),
}));
