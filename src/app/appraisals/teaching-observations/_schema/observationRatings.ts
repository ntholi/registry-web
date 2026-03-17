import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { observationCriteria } from './observationCriteria';
import { observations } from './observations';

export const observationRatings = pgTable(
	'observation_ratings',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		observationId: text()
			.references(() => observations.id, { onDelete: 'cascade' })
			.notNull(),
		criterionId: text()
			.references(() => observationCriteria.id)
			.notNull(),
		rating: integer(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueObsCriterion: unique().on(table.observationId, table.criterionId),
		observationIdIdx: index('idx_observation_ratings_observation_id').on(
			table.observationId
		),
	})
);
