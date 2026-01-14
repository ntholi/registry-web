import { terms } from '@registry/_database';
import {
	index,
	integer,
	pgTable,
	primaryKey,
	serial,
	text,
	time,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { dayOfWeekEnum, timetableAllocations } from './timetable-allocations';
import { venues } from './venues';

export const timetableSlots = pgTable(
	'timetable_slots',
	{
		id: serial().primaryKey(),
		termId: integer()
			.notNull()
			.references(() => terms.id, { onDelete: 'cascade' }),
		venueId: text()
			.notNull()
			.references(() => venues.id, { onDelete: 'cascade' }),
		dayOfWeek: dayOfWeekEnum().notNull(),
		startTime: time().notNull(),
		endTime: time().notNull(),
		capacityUsed: integer().notNull().default(0),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		termIdIdx: index('idx_timetable_slots_term_id').on(table.termId),
		venueDayIdx: index('idx_timetable_slots_venue_day').on(
			table.venueId,
			table.dayOfWeek
		),
		scheduleKey: unique('uq_timetable_slots_schedule').on(
			table.venueId,
			table.dayOfWeek,
			table.startTime,
			table.endTime
		),
	})
);

export const timetableSlotAllocations = pgTable(
	'timetable_slot_allocations',
	{
		slotId: integer()
			.references(() => timetableSlots.id, { onDelete: 'cascade' })
			.notNull(),
		timetableAllocationId: integer()
			.references(() => timetableAllocations.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.slotId, table.timetableAllocationId],
		}),
		allocationIdx: index('idx_timetable_slot_allocations_allocation').on(
			table.timetableAllocationId
		),
	})
);
