import {
	boolean,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { venues } from '../../venues/_schema/venues';
import { timetableAllocations } from './timetableAllocations';

export const timetableAllocationAllowedVenues = pgTable(
	'timetable_allocation_allowed_venues',
	{
		timetableAllocationId: integer()
			.references(() => timetableAllocations.id, { onDelete: 'cascade' })
			.notNull(),
		venueId: text()
			.references(() => venues.id, { onDelete: 'cascade' })
			.notNull(),
		allowOverflow: boolean().notNull().default(false),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.timetableAllocationId, table.venueId],
		}),
		timetableAllocationIdIdx: index(
			'fk_timetable_allocation_allowed_venues_allocation_id'
		).on(table.timetableAllocationId),
		venueIdIdx: index('fk_timetable_allocation_allowed_venues_venue_id').on(
			table.venueId
		),
	})
);
