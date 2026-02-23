import {
	index,
	pgTable,
	real,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { applications } from './applications';

export const applicationScores = pgTable(
	'application_scores',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		applicationId: text()
			.references(() => applications.id, { onDelete: 'cascade' })
			.notNull(),
		overallScore: real(),
		firstChoiceScore: real(),
		secondChoiceScore: real(),
		calculatedAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicationUnique: unique('uq_application_scores_app').on(
			table.applicationId
		),
		applicationIdx: index('fk_application_scores_app').on(table.applicationId),
	})
);
