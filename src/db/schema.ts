import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  real,
} from 'drizzle-orm/sqlite-core';
import type { AdapterAccountType } from 'next-auth/adapters';
import { nanoid } from 'nanoid';
import { relations, sql } from 'drizzle-orm';

export const dashboardUsers = ['admin', 'registry', 'finance'];
export const userRoles = ['user', 'student', ...dashboardUsers] as const;
export type UserRole = (typeof userRoles)[number];

export const users = sqliteTable('users', {
  id: text()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text(),
  role: text({ enum: userRoles }).notNull().default('user'),
  email: text().unique(),
  emailVerified: integer({ mode: 'timestamp_ms' }),
  image: text(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
  authenticators: many(authenticators),
}));

export const accounts = sqliteTable(
  'accounts',
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text().$type<AdapterAccountType>().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refresh_token: text(),
    access_token: text(),
    expires_at: integer(),
    token_type: text(),
    scope: text(),
    id_token: text(),
    session_state: text(),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessions = sqliteTable('sessions', {
  sessionToken: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer({ mode: 'timestamp_ms' }).notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const verificationTokens = sqliteTable(
  'verification_tokens',
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: integer({ mode: 'timestamp_ms' }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

export const authenticators = sqliteTable(
  'authenticators',
  {
    credentialID: text().notNull().unique(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text().notNull(),
    credentialPublicKey: text().notNull(),
    counter: integer().notNull(),
    credentialDeviceType: text().notNull(),
    credentialBackedUp: integer({
      mode: 'boolean',
    }).notNull(),
    transports: text(),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
);

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
  user: one(users, {
    fields: [authenticators.userId],
    references: [users.id],
  }),
}));

export const signups = sqliteTable('signups', {
  userId: text()
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  stdNo: text().notNull(),
  message: text().default('Pending approval'),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' }),
});

export const genderEnum = ['Male', 'Female', 'Other'] as const;
export const maritalStatusEnum = [
  'Single',
  'Married',
  'Divorced',
  'Windowed',
] as const;

export const students = sqliteTable('students', {
  stdNo: integer().primaryKey(),
  name: text().notNull(),
  nationalId: text().notNull(),
  dateOfBirth: integer({ mode: 'timestamp_ms' }).notNull(),
  phone1: text(),
  phone2: text(),
  gender: text({ enum: genderEnum }).notNull(),
  maritalStatus: text({ enum: maritalStatusEnum }).notNull(),
  religion: text(),
  structureId: integer().references(() => structures.id),
  userId: text().references(() => users.id, { onDelete: 'set null' }),
});

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

export const programStatusEnum = [
  'Active',
  'Changed',
  'Completed',
  'Deleted',
  'Inactive',
] as const;

export const studentPrograms = sqliteTable('student_programs', {
  id: integer().primaryKey(),
  code: text().notNull(),
  name: text().notNull(),
  status: text({ enum: programStatusEnum }).notNull(),
  stdNo: integer()
    .references(() => students.stdNo, { onDelete: 'cascade' })
    .notNull(),
});

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

export const semesterStatusEnum = [
  'Active',
  'Outstanding',
  'Deferred',
  'Deleted',
  'DNR',
  'DroppedOut',
  'Enrolled',
  'Exempted',
  'Inactive',
  'Repeat',
] as const;

export const studentSemesters = sqliteTable('student_semesters', {
  id: integer().primaryKey(),
  term: text().notNull(),
  status: text({ enum: semesterStatusEnum }).notNull(),
  studentProgramId: integer()
    .references(() => studentPrograms.id, { onDelete: 'cascade' })
    .notNull(),
});

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

export const moduleTypeEnum = ['Major', 'Minor', 'Core'] as const;
export const moduleStatusEnum = [
  'Add',
  'Compulsory',
  'Delete',
  'Drop',
  'Exempted',
  'Ineligible',
  'Repeat1',
  'Repeat2',
  'Repeat3',
  'Repeat4',
  'Repeat5',
  'Repeat6',
  'Repeat7',
  'Resit1',
  'Resit2',
  'Resit3',
  'Resit4',
  'Supplementary',
] as const;

export const studentModules = sqliteTable('student_modules', {
  id: integer().primaryKey(),
  code: text().notNull(),
  name: text().notNull(),
  type: text({ enum: moduleTypeEnum }).notNull(),
  status: text({ enum: moduleStatusEnum }).notNull(),
  credits: real().notNull(),
  marks: text().notNull(),
  grade: text().notNull(),
  studentSemesterId: integer()
    .references(() => studentSemesters.id, { onDelete: 'cascade' })
    .notNull(),
});

export const studentModulesRelations = relations(studentModules, ({ one }) => ({
  semester: one(studentSemesters, {
    fields: [studentModules.studentSemesterId],
    references: [studentSemesters.id],
  }),
}));

export const programs = sqliteTable('programs', {
  id: integer().primaryKey(),
  code: text().notNull().unique(),
  name: text().notNull(),
});

export const programsRelations = relations(programs, ({ many }) => ({
  structures: many(structures),
}));

export const structures = sqliteTable('structures', {
  id: integer().primaryKey(),
  code: text().notNull().unique(),
  programId: integer()
    .references(() => programs.id)
    .notNull(),
});

export const structuresRelations = relations(structures, ({ one, many }) => ({
  program: one(programs, {
    fields: [structures.programId],
    references: [programs.id],
  }),
  semesters: many(semesters),
  students: many(students),
}));

export const modules = sqliteTable('modules', {
  id: integer().primaryKey(),
  code: text().notNull(),
  name: text().notNull(),
  type: text({ enum: moduleTypeEnum }).notNull(),
  credits: real().notNull(),
});

export const modulesRelations = relations(modules, ({ many }) => ({
  semesters: many(semesterModules),
}));

export const semesters = sqliteTable('semesters', {
  id: integer().primaryKey(),
  structureId: integer()
    .references(() => structures.id)
    .notNull(),
  year: integer().notNull(),
  semesterNumber: integer().notNull(),
  totalCredits: real().notNull(),
});

export const semestersRelations = relations(semesters, ({ one, many }) => ({
  structure: one(structures, {
    fields: [semesters.structureId],
    references: [structures.id],
  }),
  modules: many(semesterModules),
}));

export const semesterModules = sqliteTable('semester_modules', {
  id: integer().primaryKey(),
  semesterId: integer()
    .references(() => semesters.id)
    .notNull(),
  moduleId: integer()
    .references(() => modules.id)
    .notNull(),
});

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
