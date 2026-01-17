import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { graduationDates, studentPrograms } from '@/core/database';

export const graduationRequests = pgTable(
	'graduation_requests',
	{
		id: serial().primaryKey(),
		studentProgramId: integer()
			.references(() => studentPrograms.id, { onDelete: 'cascade' })
			.unique()
			.notNull(),
		graduationDateId: integer()
			.references(() => graduationDates.id, {
				onDelete: 'restrict',
			})
			.notNull(),
		informationConfirmed: boolean().notNull().default(false),
		message: text(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		studentProgramIdIdx: index('fk_graduation_requests_student_program_id').on(
			table.studentProgramId
		),
		graduationDateIdIdx: index('fk_graduation_requests_graduation_date_id').on(
			table.graduationDateId
		),
	})
);
