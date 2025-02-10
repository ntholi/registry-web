import { relations } from 'drizzle-orm';
import {
  accounts,
  authenticators,
  modules,
  modulePrerequisites,
  programs,
  registrationClearances,
  registrationRequests,
  requestedModules,
  schools,
  semesterModules,
  sessions,
  signups,
  structureSemesters,
  structures,
  studentModules,
  studentPrograms,
  studentSemesters,
  students,
  terms,
  users,
  registrationClearanceAudit,
} from './schema';

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  authenticators: many(authenticators),
  signup: one(signups, {
    fields: [users.id],
    references: [signups.userId],
  }),
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
}));

export const signupsRelations = relations(signups, ({ one }) => ({
  user: one(users, {
    fields: [signups.userId],
    references: [users.id],
  }),
}));

export const studentsRelations = relations(students, ({ many, one }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  structure: one(structures, {
    fields: [students.structureId],
    references: [structures.id],
  }),
  programs: many(studentPrograms),
  registrationRequests: many(registrationRequests),
}));

export const studentProgramsRelations = relations(
  studentPrograms,
  ({ many, one }) => ({
    student: one(students, {
      fields: [studentPrograms.stdNo],
      references: [students.stdNo],
    }),
    structure: one(structures, {
      fields: [studentPrograms.structureId],
      references: [structures.id],
    }),
    semesters: many(studentSemesters),
  })
);

export const studentSemestersRelations = relations(
  studentSemesters,
  ({ many, one }) => ({
    program: one(studentPrograms, {
      fields: [studentSemesters.studentProgramId],
      references: [studentPrograms.id],
    }),
    studentModules: many(studentModules),
  })
);

export const studentModulesRelations = relations(studentModules, ({ one }) => ({
  semester: one(studentSemesters, {
    fields: [studentModules.studentSemesterId],
    references: [studentSemesters.id],
  }),
  module: one(modules, {
    fields: [studentModules.moduleId],
    references: [modules.id],
  }),
}));

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
  students: many(students),
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
  semesters: many(semesterModules),
  prerequisites: many(modulePrerequisites),
  prerequisiteFor: many(modulePrerequisites),
  requestedModules: many(requestedModules),
}));

export const modulePrerequisitesRelations = relations(
  modulePrerequisites,
  ({ one }) => ({
    module: one(modules, {
      fields: [modulePrerequisites.moduleId],
      references: [modules.id],
    }),
    prerequisite: one(modules, {
      fields: [modulePrerequisites.prerequisiteId],
      references: [modules.id],
    }),
  })
);

export const semesterModulesRelations = relations(
  semesterModules,
  ({ one }) => ({
    semester: one(structureSemesters, {
      fields: [semesterModules.semesterId],
      references: [structureSemesters.id],
    }),
    module: one(modules, {
      fields: [semesterModules.moduleId],
      references: [modules.id],
    }),
  })
);

export const termsRelations = relations(terms, ({ many }) => ({
  registrationRequests: many(registrationRequests),
}));

export const registrationRequestsRelations = relations(
  registrationRequests,
  ({ many, one }) => ({
    student: one(students, {
      fields: [registrationRequests.stdNo],
      references: [students.stdNo],
    }),
    term: one(terms, {
      fields: [registrationRequests.termId],
      references: [terms.id],
    }),
    registrationClearances: many(registrationClearances),
    requestedModules: many(requestedModules),
  })
);

export const requestedModulesRelations = relations(
  requestedModules,
  ({ one }) => ({
    registrationRequest: one(registrationRequests, {
      fields: [requestedModules.registrationRequestId],
      references: [registrationRequests.id],
    }),
    module: one(modules, {
      fields: [requestedModules.moduleId],
      references: [modules.id],
    }),
  })
);

export const registrationClearanceRelations = relations(
  registrationClearances,
  ({ one, many }) => ({
    registrationRequest: one(registrationRequests, {
      fields: [registrationClearances.registrationRequestId],
      references: [registrationRequests.id],
    }),
    clearedBy: one(users, {
      fields: [registrationClearances.respondedBy],
      references: [users.id],
    }),
    audits: many(registrationClearanceAudit),
  })
);

export const registrationClearanceAuditRelations = relations(
  registrationClearanceAudit,
  ({ one }) => ({
    registrationClearance: one(registrationClearances, {
      fields: [registrationClearanceAudit.registrationClearanceId],
      references: [registrationClearances.id],
    }),
    user: one(users, {
      fields: [registrationClearanceAudit.createdBy],
      references: [users.id],
    }),
  })
);
