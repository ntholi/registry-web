import {
	index,
	integer,
	pgEnum,
	pgTable,
	real,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { users } from '@/core/database';
import { assessmentMarks } from './assessmentMarks';

export const assessmentMarksAuditAction = pgEnum(
	'assessment_marks_audit_action',
	['create', 'update', 'delete']
);

export const assessmentMarksAudit = pgTable(
	'assessment_marks_audit',
	{
		id: serial().primaryKey(),
		assessmentMarkId: integer().references(() => assessmentMarks.id, {
			onDelete: 'set null',
		}),
		action: assessmentMarksAuditAction().notNull(),
		previousMarks: real(),
		newMarks: real(),
		createdBy: text()
			.references(() => users.id, { onDelete: 'set null' })
			.notNull(),
		date: timestamp().defaultNow().notNull(),
	},
	(table) => ({
		assessmentMarkIdIdx: index(
			'fk_assessment_marks_audit_assessment_mark_id'
		).on(table.assessmentMarkId),
		createdByIdx: index('fk_assessment_marks_audit_created_by').on(
			table.createdBy
		),
	})
);
