import {
	index,
	integer,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { semesterModules, terms } from '@/modules/academic/database';
import { users } from '@/modules/auth/database';
import { venueTypes } from './venues';

export const lecturerAllocations = pgTable(
	'lecturer_allocations',
	{
		id: serial().primaryKey(),
		duration: integer().notNull().default(30),
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
		allowedDays: text()
			.array()
			.notNull()
			.default(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
		startTime: text().notNull().default('08:30'),
		endTime: text().notNull().default('17:30'),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		userIdIdx: index('fk_lecturer_allocations_user_id').on(table.userId),
		semesterModuleIdIdx: index('fk_lecturer_allocations_semester_module_id').on(
			table.semesterModuleId
		),
		termIdIdx: index('fk_lecturer_allocations_term_id').on(table.termId),
	})
);

export const lecturerAllocationVenueTypes = pgTable(
	'lecturer_allocation_venue_types',
	{
		lecturerAllocationId: integer()
			.references(() => lecturerAllocations.id, { onDelete: 'cascade' })
			.notNull(),
		venueTypeId: integer()
			.references(() => venueTypes.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.lecturerAllocationId, table.venueTypeId],
		}),
		lecturerAllocationIdIdx: index(
			'fk_lecturer_allocation_venue_types_allocation_id'
		).on(table.lecturerAllocationId),
		venueTypeIdIdx: index(
			'fk_lecturer_allocation_venue_types_venue_type_id'
		).on(table.venueTypeId),
	})
);
