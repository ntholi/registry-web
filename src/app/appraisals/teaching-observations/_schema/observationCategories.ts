import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const observationSection = pgEnum('observation_section', [
	'teaching_observation',
	'assessments',
	'other',
]);

export const observationCategories = pgTable('observation_categories', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull(),
	section: observationSection().notNull(),
	sortOrder: integer().notNull().default(0),
	createdAt: timestamp().defaultNow(),
});
