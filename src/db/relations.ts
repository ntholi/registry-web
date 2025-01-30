import { relations } from 'drizzle-orm';
import {
  users,
  accounts,
  sessions,
  authenticators,
  students,
  studentPrograms,
  studentSemesters,
  studentModules,
  programs,
  structures,
  semesters,
  modules,
  semesterModules,
} from './schema';

export const usersRelations = relations(users, ({ one, many }) => ({
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
  authenticators: many(authenticators),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
  user: one(users, {
    fields: [authenticators.userId],
    references: [users.id],
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  structure: one(structures, {
    fields: [students.structureId],
    references: [structures.id],
  }),
  programs: many(studentPrograms),
}));

export const studentProgramsRelations = relations(
  studentPrograms,
  ({ one, many }) => ({
    student: one(students, {
      fields: [studentPrograms.stdNo],
      references: [students.stdNo],
    }),
    semesters: many(studentSemesters),
  })
);

export const studentSemestersRelations = relations(
  studentSemesters,
  ({ one, many }) => ({
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

export const programsRelations = relations(programs, ({ many }) => ({
  structures: many(structures),
}));

export const structuresRelations = relations(structures, ({ one, many }) => ({
  program: one(programs, {
    fields: [structures.programId],
    references: [programs.id],
  }),
  semesters: many(semesters),
  students: many(students),
}));

export const semestersRelations = relations(semesters, ({ one, many }) => ({
  structure: one(structures, {
    fields: [semesters.structureId],
    references: [structures.id],
  }),
  semesterModules: many(semesterModules),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  semesters: many(semesterModules),
}));

export const semesterModulesRelations = relations(
  semesterModules,
  ({ one }) => ({
    semester: one(semesters, {
      fields: [semesterModules.semesterId],
      references: [semesters.id],
    }),
    module: one(modules, {
      fields: [semesterModules.moduleId],
      references: [modules.id],
    }),
  })
);
