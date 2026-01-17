import {
	index,
	integer,
	pgTable,
	primaryKey,
	timestamp,
} from 'drizzle-orm/pg-core';
import { timetableAllocations } from '@/core/database';
import { timetableSlots } from './timetableSlots';

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
