import { modules } from '@academic/modules/_schema/modules';
import { studentModules } from '@registry/students/_schema/studentModules';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { assessmentMarks } from './assessmentMarks';
import { assessments } from './assessments';
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
	lmsAssessment: one(lmsAssessments, {
		fields: [assessments.id],
		references: [lmsAssessments.assessmentId],
	}),
}));

export const assessmentMarksRelations = relations(
	assessmentMarks,
	({ one }) => ({
		assessment: one(assessments, {
			fields: [assessmentMarks.assessmentId],
			references: [assessments.id],
		}),
		studentModule: one(studentModules, {
			fields: [assessmentMarks.studentModuleId],
			references: [studentModules.id],
		}),
	})
);

export const lmsAssessmentsRelations = relations(lmsAssessments, ({ one }) => ({
	assessment: one(assessments, {
		fields: [lmsAssessments.assessmentId],
		references: [assessments.id],
	}),
}));
