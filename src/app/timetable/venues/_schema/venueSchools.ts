import { schools } from '@academic/schools/_schema/schools';
import {
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { venues } from './venues';

export const venueSchools = pgTable(
	'venue_schools',
	{
		venueId: text()
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
