import { semesterModules } from '@academic/semester-modules/_schema/semesterModules';
import { users } from '@auth/users/_schema/users';
import { terms } from '@registry/terms/_schema/terms';
import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	time,
	timestamp,
} from 'drizzle-orm/pg-core';

export const dayOfWeekEnum = pgEnum('day_of_week', [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
]);

export const classTypeEnum = pgEnum('class_type', [
	'lecture',
	'tutorial',
	'lab',
	'workshop',
	'practical',
]);

export const timetableAllocations = pgTable(
	'timetable_allocations',
	{
		id: serial().primaryKey(),
		duration: integer().notNull(),
		classType: classTypeEnum().notNull().default('lecture'),
		numberOfStudents: integer().notNull().default(0),
		groupName: text(),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		semesterModuleId: integer()
			.notNull()
			.references(() => semesterModules.id, { onDelete: 'cascade' }),
		termId: integer()
			.notNull()
			.references(() => terms.id, { onDelete: 'cascade' }),
		allowedDays: dayOfWeekEnum().array().notNull(),
		startTime: time().notNull(),
		endTime: time().notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		userIdIdx: index('fk_timetable_allocations_user_id').on(table.userId),
		semesterModuleIdIdx: index(
			'fk_timetable_allocations_semester_module_id'
		).on(table.semesterModuleId),
		termIdIdx: index('fk_timetable_allocations_term_id').on(table.termId),
	})
);
