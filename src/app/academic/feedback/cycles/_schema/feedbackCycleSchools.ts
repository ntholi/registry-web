import { schools } from '@academic/schools/_schema/schools';
import {
	index,
	integer,
	pgTable,
	serial,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { feedbackCycles } from './feedbackCycles';

export const feedbackCycleSchools = pgTable(
	'feedback_cycle_schools',
	{
		id: serial().primaryKey(),
		cycleId: integer()
			.references(() => feedbackCycles.id, { onDelete: 'cascade' })
			.notNull(),
		schoolId: integer()
			.references(() => schools.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueCycleSchool: unique().on(table.cycleId, table.schoolId),
		cycleIdIdx: index('idx_feedback_cycle_schools_cycle_id').on(table.cycleId),
		schoolIdIdx: index('idx_feedback_cycle_schools_school_id').on(
			table.schoolId
		),
	})
);
