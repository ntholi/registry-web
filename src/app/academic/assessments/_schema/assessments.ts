import {
	index,
	integer,
	pgEnum,
	pgTable,
	real,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { modules, terms } from '@/core/database';

export const assessmentNumber = pgEnum('assessment_number', [
	'CW1',
	'CW2',
	'CW3',
	'CW4',
	'CW5',
	'CW6',
	'CW7',
	'CW8',
	'CW9',
	'CW10',
	'CW11',
	'CW12',
	'CW13',
	'CW14',
	'CW15',
]);

export type AssessmentNumber = (typeof assessmentNumber.enumValues)[number];

export const assessments = pgTable(
	'assessments',
	{
		id: serial().primaryKey(),
		moduleId: integer()
			.references(() => modules.id, { onDelete: 'cascade' })
			.notNull(),
		termId: integer()
			.references(() => terms.id, { onDelete: 'cascade' })
			.notNull(),
		assessmentNumber: assessmentNumber().notNull(),
		assessmentType: text().notNull(),
		totalMarks: real().notNull(),
		weight: real().notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueAssessmentModule: unique().on(
			table.moduleId,
			table.assessmentNumber,
			table.termId
		),
		moduleIdIdx: index('fk_assessments_module_id').on(table.moduleId),
		termIdIdx: index('fk_assessments_term_id').on(table.termId),
	})
);
