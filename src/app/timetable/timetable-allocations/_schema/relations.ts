import { semesterModules } from '@academic/semester-modules/_schema/semesterModules';
import { users } from '@auth/users/_schema/users';
import { terms } from '@registry/terms/_schema/terms';
import { timetableSlotAllocations } from '@timetable/slots/_schema/timetableSlotAllocations';
import { venues } from '@timetable/venues/_schema/venues';
import { venueTypes } from '@timetable/venues/_schema/venueTypes';
import { relations } from 'drizzle-orm';
import { timetableAllocationAllowedVenues } from './timetableAllocationAllowedVenues';
import { timetableAllocations } from './timetableAllocations';
import { timetableAllocationVenueTypes } from './timetableAllocationVenueTypes';

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
		timetableAllocationAllowedVenues: many(timetableAllocationAllowedVenues),
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

export const timetableAllocationAllowedVenuesRelations = relations(
	timetableAllocationAllowedVenues,
	({ one }) => ({
		timetableAllocation: one(timetableAllocations, {
			fields: [timetableAllocationAllowedVenues.timetableAllocationId],
			references: [timetableAllocations.id],
		}),
		venue: one(venues, {
			fields: [timetableAllocationAllowedVenues.venueId],
			references: [venues.id],
		}),
	})
);
