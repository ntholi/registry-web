import { modules } from '@academic/modules/_schema/modules';
import { users } from '@auth/users/_schema/users';
import { studentModules } from '@registry/students/_schema/studentModules';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { assessmentMarks } from './assessmentMarks';
import { assessmentMarksAudit } from './assessmentMarksAudit';
import { assessments } from './assessments';
import { assessmentsAudit } from './assessmentsAudit';
import { lmsAssessments } from './lmsAssessments';

export const assessmentsRelations = relations(assessments, ({ many, one }) => ({
	module: one(modules, {
		fields: [assessments.moduleId],
		references: [modules.id],
	}),
	term: one(terms, {
		fields: [assessments.termId],
		references: [terms.id],
	}),
	marks: many(assessmentMarks),
	audits: many(assessmentsAudit),
	lmsAssessment: one(lmsAssessments, {
		fields: [assessments.id],
		references: [lmsAssessments.assessmentId],
	}),
}));

export const assessmentMarksRelations = relations(
	assessmentMarks,
	({ one, many }) => ({
		assessment: one(assessments, {
			fields: [assessmentMarks.assessmentId],
			references: [assessments.id],
		}),
		studentModule: one(studentModules, {
			fields: [assessmentMarks.studentModuleId],
			references: [studentModules.id],
		}),
		audits: many(assessmentMarksAudit),
	})
);

export const assessmentMarksAuditRelations = relations(
	assessmentMarksAudit,
	({ one }) => ({
		assessmentMark: one(assessmentMarks, {
			fields: [assessmentMarksAudit.assessmentMarkId],
			references: [assessmentMarks.id],
		}),
		createdByUser: one(users, {
			fields: [assessmentMarksAudit.createdBy],
			references: [users.id],
		}),
	})
);

export const assessmentsAuditRelations = relations(
	assessmentsAudit,
	({ one }) => ({
		assessment: one(assessments, {
			fields: [assessmentsAudit.assessmentId],
			references: [assessments.id],
		}),
		createdByUser: one(users, {
			fields: [assessmentsAudit.createdBy],
			references: [users.id],
		}),
	})
);

export const lmsAssessmentsRelations = relations(lmsAssessments, ({ one }) => ({
	assessment: one(assessments, {
		fields: [lmsAssessments.assessmentId],
		references: [assessments.id],
	}),
}));
