import { programs } from '@academic/schools/_schema/programs';
import { applications } from '@admissions/applications/_schema/applications';
import { relations } from 'drizzle-orm';
import { intakePeriodPrograms } from './intakePeriodPrograms';
import { intakePeriods } from './intakePeriods';

export const intakePeriodsRelations = relations(intakePeriods, ({ many }) => ({
	applications: many(applications),
	intakePeriodPrograms: many(intakePeriodPrograms),
}));

export const intakePeriodProgramsRelations = relations(
	intakePeriodPrograms,
	({ one }) => ({
		intakePeriod: one(intakePeriods, {
			fields: [intakePeriodPrograms.intakePeriodId],
			references: [intakePeriods.id],
		}),
		program: one(programs, {
			fields: [intakePeriodPrograms.programId],
			references: [programs.id],
		}),
	})
);
