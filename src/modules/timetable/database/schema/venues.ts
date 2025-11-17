import {
	index,
	integer,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { schools } from '@/modules/academic/database';

export const venueTypes = pgTable('venue_types', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	description: text(),
	createdAt: timestamp().defaultNow(),
});

export const venues = pgTable(
	'venues',
	{
		id: serial().primaryKey(),
		name: text().notNull().unique(),
		capacity: integer().notNull(),
		typeId: integer()
			.references(() => venueTypes.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		typeIdIdx: index('fk_venues_type_id').on(table.typeId),
	})
);

export const venueSchools = pgTable(
	'venue_schools',
	{
		venueId: integer()
			.references(() => venues.id, { onDelete: 'cascade' })
			.notNull(),
		schoolId: integer()
			.references(() => schools.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.venueId, table.schoolId] }),
		venueIdIdx: index('fk_venue_schools_venue_id').on(table.venueId),
		schoolIdIdx: index('fk_venue_schools_school_id').on(table.schoolId),
	})
);
