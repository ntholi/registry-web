import { users } from '@auth/users/_schema/users';
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
import { assessmentNumber, assessments } from './assessments';

export const assessmentsAuditAction = pgEnum('assessments_audit_action', [
	'create',
	'update',
	'delete',
]);

export const assessmentsAudit = pgTable(
	'assessments_audit',
	{
		id: serial().primaryKey(),
		assessmentId: integer().references(() => assessments.id, {
			onDelete: 'set null',
		}),
		action: assessmentsAuditAction().notNull(),
		previousAssessmentNumber: assessmentNumber(),
		newAssessmentNumber: assessmentNumber(),
		previousAssessmentType: text(),
		newAssessmentType: text(),
		previousTotalMarks: real(),
		newTotalMarks: real(),
		previousWeight: real(),
		newWeight: real(),
		createdBy: text()
			.references(() => users.id, { onDelete: 'set null' })
			.notNull(),
		date: timestamp().defaultNow().notNull(),
	},
	(table) => ({
		assessmentIdIdx: index('fk_assessments_audit_assessment_id').on(
			table.assessmentId
		),
		createdByIdx: index('fk_assessments_audit_created_by').on(table.createdBy),
	})
);
