import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	timestamp,
} from 'drizzle-orm/pg-core';
import { assessments } from './assessments';

export const activityTypeEnum = pgEnum('activity_type', [
	'quiz',
	'assignment',
	'lesson',
	'forum',
	'workshop',
	'survey',
	'choice',
	'feedback',
	'scorm',
]);

export const lmsAssessments = pgTable(
	'lms_assessments',
	{
		id: serial().primaryKey(),
		assessmentId: integer()
			.references(() => assessments.id, { onDelete: 'cascade' })
			.notNull(),
		lmsId: integer().notNull(),
		activityType: activityTypeEnum('activity_type').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => ({
		assessmentIdIdx: index('fk_lms_assessments_assessment_id').on(
			table.assessmentId
		),
		lmsIdIdx: index('idx_lms_assessments_lms_id').on(table.lmsId),
	})
);
