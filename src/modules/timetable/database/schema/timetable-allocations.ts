import {
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	serial,
	text,
	time,
	timestamp,
} from 'drizzle-orm/pg-core';
import { semesterModules, terms } from '@/modules/academic/database';
import { users } from '@/modules/auth/database';
import { venueTypes } from './venues';

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

export const timetableAllocationVenueTypes = pgTable(
	'timetable_allocation_venue_types',
	{
		timetableAllocationId: integer()
			.references(() => timetableAllocations.id, { onDelete: 'cascade' })
			.notNull(),
		venueTypeId: integer()
			.references(() => venueTypes.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.timetableAllocationId, table.venueTypeId],
		}),
		timetableAllocationIdIdx: index(
			'fk_timetable_allocation_venue_types_allocation_id'
		).on(table.timetableAllocationId),
		venueTypeIdIdx: index(
			'fk_timetable_allocation_venue_types_venue_type_id'
		).on(table.venueTypeId),
	})
);
