import {
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { venueTypes } from '../../venues/_schema/venueTypes';
import { timetableAllocations } from './timetableAllocations';

export const timetableAllocationVenueTypes = pgTable(
	'timetable_allocation_venue_types',
	{
		timetableAllocationId: integer()
			.references(() => timetableAllocations.id, { onDelete: 'cascade' })
			.notNull(),
		venueTypeId: text()
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
