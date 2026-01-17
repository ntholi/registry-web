import { relations } from 'drizzle-orm';
import {
	semesterModules,
	terms,
	timetableSlotAllocations,
	users,
	venueTypes,
} from '@/core/database';
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
