import { schools } from '@academic/schools/_schema/schools';
import { timetableSlots } from '@timetable/slots/_schema/timetableSlots';
import { timetableAllocationVenueTypes } from '@timetable/timetable-allocations/_schema/timetableAllocationVenueTypes';
import { relations } from 'drizzle-orm';
import { venueSchools } from './venueSchools';
import { venues } from './venues';
import { venueTypes } from './venueTypes';

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
