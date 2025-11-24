import { relations } from 'drizzle-orm';
import { schools, semesterModules, terms } from '@/modules/academic/database';
import { users } from '@/modules/auth/database';
import {
	timetableAllocations,
	timetableAllocationVenueTypes,
} from './schema/timetable-allocations';
import {
	timetableSlotAllocations,
	timetableSlots,
} from './schema/timetable-slots';
import { venueSchools, venues, venueTypes } from './schema/venues';

export const venueTypesRelations = relations(venueTypes, ({ many }) => ({
	venues: many(venues),
	timetableAllocationVenueTypes: many(timetableAllocationVenueTypes),
}));

export const venuesRelations = relations(venues, ({ many, one }) => ({
	type: one(venueTypes, {
		fields: [venues.typeId],
		references: [venueTypes.id],
	}),
	venueSchools: many(venueSchools),
	timetableSlots: many(timetableSlots),
}));

export const venueSchoolsRelations = relations(venueSchools, ({ one }) => ({
	venue: one(venues, {
		fields: [venueSchools.venueId],
		references: [venues.id],
	}),
	school: one(schools, {
		fields: [venueSchools.schoolId],
		references: [schools.id],
	}),
}));

export const timetableAllocationsRelations = relations(
	timetableAllocations,
	({ many, one }) => ({
		user: one(users, {
			fields: [timetableAllocations.userId],
			references: [users.id],
		}),
		semesterModule: one(semesterModules, {
			fields: [timetableAllocations.semesterModuleId],
			references: [semesterModules.id],
		}),
		term: one(terms, {
			fields: [timetableAllocations.termId],
			references: [terms.id],
		}),
		timetableAllocationVenueTypes: many(timetableAllocationVenueTypes),
		timetableSlotAllocations: many(timetableSlotAllocations),
	})
);

export const timetableAllocationVenueTypesRelations = relations(
	timetableAllocationVenueTypes,
	({ one }) => ({
		timetableAllocation: one(timetableAllocations, {
			fields: [timetableAllocationVenueTypes.timetableAllocationId],
			references: [timetableAllocations.id],
		}),
		venueType: one(venueTypes, {
			fields: [timetableAllocationVenueTypes.venueTypeId],
			references: [venueTypes.id],
		}),
	})
);

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
