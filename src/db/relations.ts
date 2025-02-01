import { relations } from 'drizzle-orm';
import {
  accounts,
  authenticators,
  clearanceTasks,
  clearanceRequests,
  modules,
  programs,
  schools,
  semesterModules,
  sessions,
  signups,
  studentModules,
  studentPrograms,
  studentSemesters,
  students,
  structureSemesters,
  structures,
  terms,
  users,
  registrationRequests,
  requestedModules,
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
  clearanceRequests: many(clearanceRequests),
}));

export const studentProgramsRelations = relations(
  studentPrograms,
  ({ many, one }) => ({
    student: one(students, {
      fields: [studentPrograms.stdNo],
      references: [students.stdNo],
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
    modules: many(studentModules),
  })
);

export const studentModulesRelations = relations(studentModules, ({ one }) => ({
  semester: one(studentSemesters, {
    fields: [studentModules.studentSemesterId],
    references: [studentSemesters.id],
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
}));

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

export const clearanceRequestsRelations = relations(
  clearanceRequests,
  ({ many, one }) => ({
    student: one(students, {
      fields: [clearanceRequests.stdNo],
      references: [students.stdNo],
    }),
    registrationRequest: one(registrationRequests, {
      fields: [clearanceRequests.registrationRequestId],
      references: [registrationRequests.id],
    }),
    term: one(terms, {
      fields: [clearanceRequests.termId],
      references: [terms.id],
    }),
    tasks: many(clearanceTasks),
    clearedSemesters: many(clearanceTasks),
  })
);

export const clearanceTasksRelations = relations(clearanceTasks, ({ one }) => ({
  clearanceRequest: one(clearanceRequests, {
    fields: [clearanceTasks.clearanceRequestId],
    references: [clearanceRequests.id],
  }),
  clearedBy: one(users, {
    fields: [clearanceTasks.clearedBy],
    references: [users.id],
  }),
}));
