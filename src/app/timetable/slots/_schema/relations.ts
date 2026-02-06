import { terms } from '@registry/terms/_schema/terms';
import { timetableAllocations } from '@timetable/timetable-allocations/_schema/timetableAllocations';
import { venues } from '@timetable/venues/_schema/venues';
import { relations } from 'drizzle-orm';
import { timetableSlotAllocations } from './timetableSlotAllocations';
import { timetableSlots } from './timetableSlots';

export const timetableSlotsRelations = relations(
	timetableSlots,
	({ many, one }) => ({
		term: one(terms, {
			fields: [timetableSlots.termId],
			references: [terms.id],
		}),
		venue: one(venues, {
			fields: [timetableSlots.venueId],
			references: [venues.id],
		}),
		timetableSlotAllocations: many(timetableSlotAllocations),
	})
);

export const timetableSlotAllocationsRelations = relations(
	timetableSlotAllocations,
	({ one }) => ({
		slot: one(timetableSlots, {
			fields: [timetableSlotAllocations.slotId],
			references: [timetableSlots.id],
		}),
		timetableAllocation: one(timetableAllocations, {
			fields: [timetableSlotAllocations.timetableAllocationId],
			references: [timetableAllocations.id],
		}),
	})
);
