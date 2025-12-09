import { relations } from 'drizzle-orm';
import { users } from '@/modules/auth/database';
import {
	assessmentMarks,
	assessmentMarksAudit,
	assessments,
	assessmentsAudit,
	assignedModules,
	lmsAssessments,
	moduleGrades,
} from './schema/assessments';
import {
	modulePrerequisites,
	modules,
	semesterModules,
} from './schema/modules';
import { programs, schools } from './schema/schools';
import { structureSemesters, structures } from './schema/structures';
import { terms } from './schema/terms';

export const schoolsRelations = relations(schools, ({ many }) => ({
	programs: many(programs),
}));

export const programsRelations = relations(programs, ({ many, one }) => ({
	school: one(schools, {
		fields: [programs.schoolId],
		references: [schools.id],
	}),
	structures: many(structures),
}));

export const structuresRelations = relations(structures, ({ many, one }) => ({
	program: one(programs, {
		fields: [structures.programId],
		references: [programs.id],
	}),
	semesters: many(structureSemesters),
}));

export const structureSemestersRelations = relations(
	structureSemesters,
	({ many, one }) => ({
		structure: one(structures, {
			fields: [structureSemesters.structureId],
			references: [structures.id],
		}),
		semesterModules: many(semesterModules),
	})
);

export const modulesRelations = relations(modules, ({ many }) => ({
	semesterModules: many(semesterModules),
	assessments: many(assessments),
	moduleGrades: many(moduleGrades),
}));

export const semesterModulesRelations = relations(
	semesterModules,
	({ many, one }) => ({
		prerequisites: many(modulePrerequisites, {
			relationName: 'semesterModulePrerequisites',
		}),
		prerequisiteFor: many(modulePrerequisites, {
			relationName: 'prerequisiteModules',
		}),
		semester: one(structureSemesters, {
			fields: [semesterModules.semesterId],
			references: [structureSemesters.id],
		}),
		module: one(modules, {
			fields: [semesterModules.moduleId],
			references: [modules.id],
		}),
		assignedModules: many(assignedModules),
	})
);

export const modulePrerequisitesRelations = relations(
	modulePrerequisites,
	({ one }) => ({
		semesterModule: one(semesterModules, {
			fields: [modulePrerequisites.semesterModuleId],
			references: [semesterModules.id],
			relationName: 'semesterModulePrerequisites',
		}),
		prerequisite: one(semesterModules, {
			fields: [modulePrerequisites.prerequisiteId],
			references: [semesterModules.id],
			relationName: 'prerequisiteModules',
		}),
	})
);

export const termsRelations = relations(terms, ({ many }) => ({
	assignedModules: many(assignedModules),
	assessments: many(assessments),
}));

export const assignedModulesRelations = relations(
	assignedModules,
	({ one }) => ({
		user: one(users, {
			fields: [assignedModules.userId],
			references: [users.id],
		}),
		semesterModule: one(semesterModules, {
			fields: [assignedModules.semesterModuleId],
			references: [semesterModules.id],
		}),
		term: one(terms, {
			fields: [assignedModules.termId],
			references: [terms.id],
		}),
	})
);

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

export const moduleGradesRelations = relations(moduleGrades, ({ one }) => ({
	module: one(modules, {
		fields: [moduleGrades.moduleId],
		references: [modules.id],
	}),
}));

export const lmsAssessmentsRelations = relations(lmsAssessments, ({ one }) => ({
	assessment: one(assessments, {
		fields: [lmsAssessments.assessmentId],
		references: [assessments.id],
	}),
}));
