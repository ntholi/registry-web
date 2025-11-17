import { relations } from 'drizzle-orm';
import { schools, semesterModules, terms } from '@/modules/academic/database';
import { users } from '@/modules/auth/database';
import {
	lecturerAllocations,
	lecturerAllocationVenueTypes,
} from './schema/lecturer-allocations';
import { venueSchools, venues, venueTypes } from './schema/venues';

export const venueTypesRelations = relations(venueTypes, ({ many }) => ({
	venues: many(venues),
	lecturerAllocationVenueTypes: many(lecturerAllocationVenueTypes),
}));

export const venuesRelations = relations(venues, ({ many, one }) => ({
	type: one(venueTypes, {
		fields: [venues.typeId],
		references: [venueTypes.id],
	}),
	venueSchools: many(venueSchools),
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

export const lecturerAllocationsRelations = relations(
	lecturerAllocations,
	({ many, one }) => ({
		user: one(users, {
			fields: [lecturerAllocations.userId],
			references: [users.id],
		}),
		semesterModule: one(semesterModules, {
			fields: [lecturerAllocations.semesterModuleId],
			references: [semesterModules.id],
		}),
		term: one(terms, {
			fields: [lecturerAllocations.termId],
			references: [terms.id],
		}),
		lecturerAllocationVenueTypes: many(lecturerAllocationVenueTypes),
	})
);

export const lecturerAllocationVenueTypesRelations = relations(
	lecturerAllocationVenueTypes,
	({ one }) => ({
		lecturerAllocation: one(lecturerAllocations, {
			fields: [lecturerAllocationVenueTypes.lecturerAllocationId],
			references: [lecturerAllocations.id],
		}),
		venueType: one(venueTypes, {
			fields: [lecturerAllocationVenueTypes.venueTypeId],
			references: [venueTypes.id],
		}),
	})
);
