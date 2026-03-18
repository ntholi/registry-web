import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { observationCategories } from './observationCategories';

export const observationCriteria = pgTable(
	'observation_criteria',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		categoryId: text()
			.references(() => observationCategories.id, { onDelete: 'cascade' })
			.notNull(),
		title: text(),
		text: text().notNull(),
		description: text(),
		sortOrder: integer().notNull().default(0),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		categoryIdIdx: index('idx_observation_criteria_category_id').on(
			table.categoryId
		),
	})
);
