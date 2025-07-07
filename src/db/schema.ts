import { sql } from 'drizzle-orm';
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import type { AdapterAccountType } from 'next-auth/adapters';

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

export const userPositions = [
  'manager',
  'program_leader',
  'principal_lecturer',
  'year_leader',
  'lecturer',
  'admin',
] as const;
export type UserPosition = (typeof userPositions)[number];

export const users = sqliteTable('users', {
  id: text()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text(),
  role: text({ enum: userRoles }).notNull().default('user'),
  position: text({ enum: userPositions }),
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
  sem: integer().notNull(), //TODO: Remove this
  dateOfBirth: integer({ mode: 'timestamp_ms' }),
  phone1: text(),
  phone2: text(),
  gender: text({ enum: genderEnum }),
  maritalStatus: text({ enum: maritalStatusEnum }),
  religion: text(),
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
  intakeDate: text(),
  regDate: text(),
  startTerm: text(),
  structureId: integer()
    .references(() => structures.id, { onDelete: 'cascade' })
    .notNull(),
  stream: text(),
  graduationDate: text(),
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
  cafDate: text(),
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
  'Def',
  'GNS',
  'ANN',
  'FIN',
  'FX',
  'DNC',
  'DNA',
  'PP',
  'DNS',
  'EXP',
  'NM',
] as const;

export type ModuleStatus = (typeof moduleStatusEnum)[number];
export type Grade = (typeof gradeEnum)[number];

export const studentModules = sqliteTable('student_modules', {
  id: integer().primaryKey(),
  semesterModuleId: integer()
    .references(() => semesterModules.id, { onDelete: 'cascade' })
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
  desc: text(),
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
  status: text({ enum: ['Active', 'Defunct'] })
    .notNull()
    .default('Active'),
  timestamp: text(),
});

export const semesterModules = sqliteTable('semester_modules', {
  id: integer().primaryKey(),
  moduleId: integer().references(() => modules.id), //TODO: AFTER DELETING CODE, MAKE THIS NOT NULL
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
    semesterModuleId: integer()
      .references(() => semesterModules.id, { onDelete: 'cascade' })
      .notNull(),
    prerequisiteId: integer()
      .references(() => semesterModules.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (table) => ({
    uniquePrerequisite: unique().on(
      table.semesterModuleId,
      table.prerequisiteId,
    ),
  }),
);

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
  'partial',
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
    mailSent: integer({ mode: 'boolean' }).notNull().default(false),
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
  semesterModuleId: integer()
    .references(() => semesterModules.id, { onDelete: 'cascade' })
    .notNull(),
  status: text({ enum: requestedModuleStatusEnum })
    .notNull()
    .default('pending'),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const clearanceRequestStatusEnum = [
  'pending',
  'approved',
  'rejected',
] as const;

export const registrationClearances = sqliteTable(
  'registration_clearances',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    registrationRequestId: integer()
      .references(() => registrationRequests.id, { onDelete: 'cascade' })
      .notNull(),
    department: text({ enum: dashboardUsers }).notNull(),
    status: text({ enum: clearanceRequestStatusEnum })
      .notNull()
      .default('pending'),
    message: text(),
    emailSent: integer({ mode: 'boolean' }).notNull().default(false),
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

export const assignedModules = sqliteTable('assigned_modules', {
  id: integer().primaryKey({ autoIncrement: true }),
  termId: integer()
    .references(() => terms.id, { onDelete: 'cascade' })
    .notNull(),
  active: integer({ mode: 'boolean' }).notNull().default(true),
  userId: text()
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  semesterModuleId: integer()
    .references(() => semesterModules.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const userSchools = sqliteTable(
  'user_schools',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: text()
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    schoolId: integer()
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (table) => ({
    uniqueUserSchool: unique().on(table.userId, table.schoolId),
  }),
);

export const assessmentNumberEnum = [
  'CW1',
  'CW2',
  'CW3',
  'CW4',
  'CW5',
  'CW6',
  'CW7',
  'CW8',
  'CW9',
  'CW10',
  'CW11',
  'CW12',
  'CW13',
  'CW14',
  'CW15',
] as const;

export const assessments = sqliteTable(
  'assessments',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    moduleId: integer()
      .references(() => modules.id, { onDelete: 'cascade' })
      .notNull(),
    termId: integer()
      .references(() => terms.id, { onDelete: 'cascade' })
      .notNull(),
    assessmentNumber: text({ enum: assessmentNumberEnum }).notNull(),
    assessmentType: text().notNull(),
    totalMarks: real().notNull(),
    weight: real().notNull(),
    createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (table) => ({
    uniqueAssessmentModule: unique().on(
      table.moduleId,
      table.assessmentNumber,
      table.termId,
    ),
  }),
);

export const assessmentMarks = sqliteTable('assessment_marks', {
  id: integer().primaryKey({ autoIncrement: true }),
  assessmentId: integer()
    .references(() => assessments.id, { onDelete: 'cascade' })
    .notNull(),
  stdNo: integer()
    .references(() => students.stdNo, { onDelete: 'cascade' })
    .notNull(),
  marks: real().notNull(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const assessmentMarksAuditActionEnum = [
  'create',
  'update',
  'delete',
] as const;

export const assessmentMarksAudit = sqliteTable('assessment_marks_audit', {
  id: integer().primaryKey({ autoIncrement: true }),
  assessmentMarkId: integer().references(() => assessmentMarks.id, {
    onDelete: 'set null',
  }),
  action: text({ enum: assessmentMarksAuditActionEnum }).notNull(),
  previousMarks: real(),
  newMarks: real(),
  createdBy: text()
    .references(() => users.id, { onDelete: 'set null' })
    .notNull(),
  date: integer({ mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const assessmentsAuditActionEnum = [
  'create',
  'update',
  'delete',
] as const;

export const assessmentsAudit = sqliteTable('assessments_audit', {
  id: integer().primaryKey({ autoIncrement: true }),
  assessmentId: integer().references(() => assessments.id, {
    onDelete: 'set null',
  }),
  action: text({ enum: assessmentsAuditActionEnum }).notNull(),
  previousAssessmentNumber: text({ enum: assessmentNumberEnum }),
  newAssessmentNumber: text({ enum: assessmentNumberEnum }),
  previousAssessmentType: text(),
  newAssessmentType: text(),
  previousTotalMarks: real(),
  newTotalMarks: real(),
  previousWeight: real(),
  newWeight: real(),
  createdBy: text()
    .references(() => users.id, { onDelete: 'set null' })
    .notNull(),
  date: integer({ mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const moduleGrades = sqliteTable(
  'module_grades',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    moduleId: integer()
      .references(() => modules.id, { onDelete: 'cascade' })
      .notNull(),
    stdNo: integer()
      .references(() => students.stdNo, { onDelete: 'cascade' })
      .notNull(),
    grade: text({ enum: gradeEnum }).notNull(),
    weightedTotal: real().notNull(),
    createdAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
    updatedAt: integer({ mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (table) => ({
    uniqueModuleStudent: unique().on(table.moduleId, table.stdNo),
  }),
);

export const statementOfResultsPrints = sqliteTable(
  'statement_of_results_prints',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    stdNo: integer()
      .references(() => students.stdNo, { onDelete: 'cascade' })
      .notNull(),
    printedBy: text()
      .references(() => users.id, { onDelete: 'set null' })
      .notNull(),
    studentName: text().notNull(),
    programName: text().notNull(),
    totalCredits: integer().notNull(),
    totalModules: integer().notNull(),
    cgpa: real(),
    classification: text(),
    academicStatus: text(),
    graduationDate: text(),
    printedAt: integer({ mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
);
