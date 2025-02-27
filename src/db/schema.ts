import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  real,
  unique,
} from 'drizzle-orm/sqlite-core';
import type { AdapterAccountType } from 'next-auth/adapters';
import { nanoid } from 'nanoid';
import { sql } from 'drizzle-orm';

export const dashboardUsers = [
  'finance',
  'registry',
  'library',
  'resource',
  'academic',
  'admin',
] as const;
export type DashboardUser = (typeof dashboardUsers)[number];
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
  }),
);

export const sessions = sqliteTable('sessions', {
  sessionToken: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer({ mode: 'timestamp_ms' }).notNull(),
});

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
  }),
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
  }),
);

export const signupStatusEnum = ['pending', 'approved', 'rejected'] as const;
export const signups = sqliteTable('signups', {
  userId: text()
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  stdNo: text().notNull(),
  status: text({ enum: signupStatusEnum }).notNull().default('pending'),
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
  sem: integer().notNull(),
  dateOfBirth: integer({ mode: 'timestamp_ms' }),
  phone1: text(),
  phone2: text(),
  gender: text({ enum: genderEnum }),
  maritalStatus: text({ enum: maritalStatusEnum }),
  religion: text(),
  structureId: integer().references(() => structures.id, {
    onDelete: 'set null',
  }),
  userId: text().references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const programStatusEnum = [
  'Active',
  'Changed',
  'Completed',
  'Deleted',
  'Inactive',
] as const;

export const studentPrograms = sqliteTable('student_programs', {
  id: integer().primaryKey(),
  stdNo: integer()
    .references(() => students.stdNo, { onDelete: 'cascade' })
    .notNull(),
  startTerm: text(),
  structureId: integer()
    .references(() => structures.id, { onDelete: 'cascade' })
    .notNull(),
  stream: text(),
  status: text({ enum: programStatusEnum }).notNull(),
  assistProvider: text(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

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
  semesterNumber: integer(),
  status: text({ enum: semesterStatusEnum }).notNull(),
  studentProgramId: integer()
    .references(() => studentPrograms.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const moduleTypeEnum = [
  'Major',
  'Minor',
  'Core',
  'Delete',
  'Elective',
] as const;

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

export const gradeEnum = [
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'F',
  'PC',
  'PX',
  'AP',
  'X',
  'GNS',
  'ANN',
  'FIN',
  'FX',
  'DNC',
  'DNA',
  'PP',
  'DNS',
] as const;

export type ModuleStatus = (typeof moduleStatusEnum)[number];
export type Grade = (typeof gradeEnum)[number];

export const studentModules = sqliteTable('student_modules', {
  id: integer().primaryKey(),
  moduleId: integer()
    .references(() => modules.id, { onDelete: 'cascade' })
    .notNull(),
  status: text({ enum: moduleStatusEnum }).notNull(),
  marks: text().notNull(),
  grade: text({ enum: gradeEnum }).notNull(),
  studentSemesterId: integer()
    .references(() => studentSemesters.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const schools = sqliteTable('schools', {
  id: integer().primaryKey(),
  code: text().notNull().unique(),
  name: text().notNull(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const programLevelEnum = ['certificate', 'diploma', 'degree'] as const;
export const programs = sqliteTable('programs', {
  id: integer().primaryKey(),
  code: text().notNull().unique(),
  name: text().notNull(),
  level: text({ enum: programLevelEnum }).notNull(),
  schoolId: integer()
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const structures = sqliteTable('structures', {
  id: integer().primaryKey(),
  code: text().notNull().unique(),
  programId: integer()
    .references(() => programs.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const structureSemesters = sqliteTable('structure_semesters', {
  id: integer().primaryKey(),
  structureId: integer()
    .references(() => structures.id, { onDelete: 'cascade' })
    .notNull(),
  semesterNumber: integer().notNull(),
  name: text().notNull(),
  totalCredits: real().notNull(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const modules = sqliteTable('modules', {
  id: integer().primaryKey(),
  code: text().notNull(),
  name: text().notNull(),
  type: text({ enum: moduleTypeEnum }).notNull(),
  credits: real().notNull(),
  semesterId: integer().references(() => structureSemesters.id, {
    onDelete: 'set null',
  }),
  hidden: integer({ mode: 'boolean' }).notNull().default(false),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const modulePrerequisites = sqliteTable(
  'module_prerequisites',
  {
    id: integer().primaryKey(),
    moduleId: integer()
      .references(() => modules.id, { onDelete: 'cascade' })
      .notNull(),
    prerequisiteId: integer()
      .references(() => modules.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (table) => ({
    uniquePrerequisite: unique().on(table.moduleId, table.prerequisiteId),
  }),
);

//TODO: DELETE THIS TABLE
export const semesterModules = sqliteTable('semester_modules', {
  id: integer().primaryKey(),
  semesterId: integer()
    .references(() => structureSemesters.id, { onDelete: 'cascade' })
    .notNull(),
  moduleId: integer()
    .references(() => modules.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const terms = sqliteTable('terms', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  isActive: integer({ mode: 'boolean' }).notNull().default(false),
  semester: integer().notNull(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const registrationRequestStatusEnum = [
  'pending',
  'approved',
  'rejected',
  'registered',
] as const;

export const registrationRequests = sqliteTable(
  'registration_requests',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sponsorId: integer('sponsor_id')
      .references(() => sponsors.id, { onDelete: 'cascade' })
      .notNull(),
    stdNo: integer('std_no')
      .references(() => students.stdNo, { onDelete: 'cascade' })
      .notNull(),
    termId: integer('term_id')
      .references(() => terms.id, { onDelete: 'cascade' })
      .notNull(),
    status: text({ enum: registrationRequestStatusEnum })
      .notNull()
      .default('pending'),
    semesterStatus: text({ enum: ['Active', 'Repeat'] }).notNull(),
    semesterNumber: integer().notNull(),
    message: text(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(
      sql`(unixepoch())`,
    ),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
    dateApproved: integer({ mode: 'timestamp' }),
  },
  (table) => ({
    uniqueRegistrationRequests: unique().on(table.stdNo, table.termId),
  }),
);

export const requestedModuleStatusEnum = [
  'pending',
  'registered',
  'rejected',
] as const;

export const requestedModules = sqliteTable('requested_modules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  moduleStatus: text({ enum: moduleStatusEnum })
    .notNull()
    .default('Compulsory'),
  registrationRequestId: integer('registration_request_id')
    .references(() => registrationRequests.id, { onDelete: 'cascade' })
    .notNull(),
  moduleId: integer('module_id')
    .references(() => modules.id, { onDelete: 'cascade' })
    .notNull(),
  status: text({ enum: requestedModuleStatusEnum })
    .notNull()
    .default('pending'),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const registrationClearances = sqliteTable(
  'registration_clearances',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    registrationRequestId: integer()
      .references(() => registrationRequests.id, { onDelete: 'cascade' })
      .notNull(),
    department: text({ enum: dashboardUsers }).notNull(),
    status: text({ enum: registrationRequestStatusEnum })
      .notNull()
      .default('pending'),
    message: text(),
    respondedBy: text().references(() => users.id, { onDelete: 'cascade' }),
    responseDate: integer({ mode: 'timestamp' }),
    createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (table) => ({
    uniqueRegistrationClearance: unique().on(
      table.registrationRequestId,
      table.department,
    ),
  }),
);

export const registrationClearanceAudit = sqliteTable(
  'registration_clearance_audit',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    registrationClearanceId: integer()
      .references(() => registrationClearances.id, { onDelete: 'cascade' })
      .notNull(),
    previousStatus: text({ enum: registrationRequestStatusEnum }),
    newStatus: text({ enum: registrationRequestStatusEnum }).notNull(),
    createdBy: text()
      .references(() => users.id, { onDelete: 'set null' })
      .notNull(),
    date: integer({ mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    message: text(),
    modules: text({ mode: 'json' })
      .notNull()
      .$type<string[]>()
      .default(sql`(json_array())`),
  },
);

export const sponsors = sqliteTable('sponsors', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' }),
});

export const sponsoredStudents = sqliteTable(
  'sponsored_students',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    sponsorId: integer()
      .references(() => sponsors.id, { onDelete: 'cascade' })
      .notNull(),
    stdNo: integer()
      .references(() => students.stdNo, { onDelete: 'cascade' })
      .notNull(),
    borrowerNo: text(),
    termId: integer()
      .references(() => terms.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
    updatedAt: integer({ mode: 'timestamp' }),
  },
  (table) => ({
    uniqueSponsoredTerm: unique().on(table.stdNo, table.termId),
  }),
);
