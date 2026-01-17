import {
	index,
	integer,
	pgTable,
	serial,
	text,
	time,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { dayOfWeekEnum, terms, venues } from '@/core/database';

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
