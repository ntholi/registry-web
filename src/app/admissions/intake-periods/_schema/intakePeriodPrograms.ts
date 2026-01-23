import { programs } from '@academic/schools/_schema/programs';
import {
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { intakePeriods } from './intakePeriods';

export const intakePeriodPrograms = pgTable(
	'intake_period_programs',
	{
		intakePeriodId: text()
			.references(() => intakePeriods.id, { onDelete: 'cascade' })
			.notNull(),
		programId: integer()
			.references(() => programs.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.intakePeriodId, table.programId] }),
		intakePeriodIdx: index('fk_intake_period_programs_intake').on(
			table.intakePeriodId
		),
		programIdx: index('fk_intake_period_programs_program').on(table.programId),
	})
);
