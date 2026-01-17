import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { venueTypes } from './venueTypes';

export const venues = pgTable(
	'venues',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		name: text().notNull().unique(),
		capacity: integer().notNull(),
		typeId: text()
			.references(() => venueTypes.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		typeIdIdx: index('fk_venues_type_id').on(table.typeId),
	})
);
