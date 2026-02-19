import { schools } from '@academic/schools/_schema/schools';
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { feedbackCycles } from './feedbackCycles';

export const feedbackCycleSchools = pgTable(
	'feedback_cycle_schools',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		cycleId: text()
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
