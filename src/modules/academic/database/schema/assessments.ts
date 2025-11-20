import {
	bigint,
	boolean,
	index,
	integer,
	pgTable,
	real,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { users } from '@/modules/auth/database';
import {
	assessmentMarksAuditAction,
	assessmentNumber,
	assessmentsAuditAction,
	grade,
} from './enums';
import { modules, semesterModules } from './modules';
import { terms } from './terms';

export const assignedModules = pgTable(
	'assigned_modules',
	{
		id: serial().primaryKey(),
		termId: integer()
			.references(() => terms.id, { onDelete: 'cascade' })
			.notNull(),
		active: boolean().notNull().default(true),
		userId: text()
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		semesterModuleId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		courseId: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		userIdIdx: index('fk_assigned_modules_user_id').on(table.userId),
		termIdIdx: index('fk_assigned_modules_term_id').on(table.termId),
		semesterModuleIdIdx: index('fk_assigned_modules_semester_module_id').on(
			table.semesterModuleId
		),
		courseIdIdx: index('idx_assigned_modules_course_id').on(table.courseId),
	})
);

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

export const assessmentMarks = pgTable(
	'assessment_marks',
	{
		id: serial().primaryKey(),
		assessmentId: integer()
			.references(() => assessments.id, { onDelete: 'cascade' })
			.notNull(),
		stdNo: bigint({ mode: 'number' }).notNull(),
		marks: real().notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		assessmentIdIdx: index('fk_assessment_marks_assessment_id').on(
			table.assessmentId
		),
		stdNoIdx: index('fk_assessment_marks_std_no').on(table.stdNo),
		assessmentIdStdNoIdx: index('idx_assessment_marks_assessment_id_std_no').on(
			table.assessmentId,
			table.stdNo
		),
	})
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

export const moduleGrades = pgTable(
	'module_grades',
	{
		id: serial().primaryKey(),
		moduleId: integer()
			.references(() => modules.id, { onDelete: 'cascade' })
			.notNull(),
		stdNo: bigint({ mode: 'number' }).notNull(),
		grade: grade().notNull(),
		weightedTotal: real().notNull(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueModuleStudent: unique().on(table.moduleId, table.stdNo),
	})
);
