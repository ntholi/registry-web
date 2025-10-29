import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
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

export const users = pgTable('users', {
  id: text()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text(),
  role: text({ enum: userRoles }).notNull().default('user'),
  position: text({ enum: userPositions }),
  email: text().unique(),
  emailVerified: timestamp({ mode: 'date' }),
  image: text(),
});

export const accounts = pgTable(
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

export const sessions = pgTable('sessions', {
  sessionToken: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp({ mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp({ mode: 'date' }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

export const authenticators = pgTable(
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
    credentialBackedUp: boolean().notNull(),
    transports: text(),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
);

export const signupStatusEnum = ['pending', 'approved', 'rejected'] as const;
export const signups = pgTable('signups', {
  userId: text()
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  stdNo: text().notNull(),
  status: text({ enum: signupStatusEnum }).notNull().default('pending'),
  message: text().default('Pending approval'),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
});

export const genderEnum = ['Male', 'Female', 'Other'] as const;
export const maritalStatusEnum = [
  'Single',
  'Married',
  'Divorced',
  'Windowed',
] as const;

export const students = pgTable('students', {
  stdNo: bigint({ mode: 'number' }).primaryKey(),
  name: text().notNull(),
  nationalId: text().notNull(),
  sem: integer().notNull(), //TODO: Remove this
  dateOfBirth: timestamp({ mode: 'date' }),
  phone1: text(),
  phone2: text(),
  gender: text({ enum: genderEnum }),
  maritalStatus: text({ enum: maritalStatusEnum }),
  religion: text(),
  userId: text().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp().defaultNow(),
});

export const programStatusEnum = [
  'Active',
  'Changed',
  'Completed',
  'Deleted',
  'Inactive',
] as const;
export type StudentProgramStatus = (typeof programStatusEnum)[number];

export const studentPrograms = pgTable('student_programs', {
  id: serial().primaryKey(),
  stdNo: bigint({ mode: 'number' })
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
  createdAt: timestamp().defaultNow(),
});

export const semesterStatusEnum = [
  'Active',
  'Outstanding',
  'Deferred',
  'Deleted',
  'DNR',
  'DroppedOut',
  'Withdrawn',
  'Enrolled',
  'Exempted',
  'Inactive',
  'Repeat',
] as const;

export type SemesterStatus = (typeof semesterStatusEnum)[number];
export const studentSemesters = pgTable('student_semesters', {
  id: serial().primaryKey(),
  term: text().notNull(),
  semesterNumber: integer(),
  status: text({ enum: semesterStatusEnum }).notNull(),
  studentProgramId: integer()
    .references(() => studentPrograms.id, { onDelete: 'cascade' })
    .notNull(),
  cafDate: text(),
  createdAt: timestamp().defaultNow(),
});

export const studentModuleStatusEnum = [
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

export type StudentModuleStatus = (typeof studentModuleStatusEnum)[number];
export type Grade = (typeof gradeEnum)[number];

export const studentModules = pgTable('student_modules', {
  id: serial().primaryKey(),
  semesterModuleId: integer()
    .references(() => semesterModules.id, { onDelete: 'cascade' })
    .notNull(),
  status: text({ enum: studentModuleStatusEnum }).notNull(),
  marks: text().notNull(),
  grade: text({ enum: gradeEnum }).notNull(),
  studentSemesterId: integer()
    .references(() => studentSemesters.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp().defaultNow(),
});

export const schools = pgTable('schools', {
  id: serial().primaryKey(),
  code: text().notNull().unique(),
  name: text().notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow(),
});

export const programLevelEnum = ['certificate', 'diploma', 'degree'] as const;
export const programs = pgTable('programs', {
  id: serial().primaryKey(),
  code: text().notNull().unique(),
  name: text().notNull(),
  level: text({ enum: programLevelEnum }).notNull(),
  schoolId: integer()
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp().defaultNow(),
});

export const structures = pgTable('structures', {
  id: serial().primaryKey(),
  code: text().notNull().unique(),
  desc: text(),
  programId: integer()
    .references(() => programs.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp().defaultNow(),
});

export const structureSemesters = pgTable('structure_semesters', {
  id: serial().primaryKey(),
  structureId: integer()
    .references(() => structures.id, { onDelete: 'cascade' })
    .notNull(),
  semesterNumber: integer().notNull(),
  name: text().notNull(),
  totalCredits: real().notNull(),
  createdAt: timestamp().defaultNow(),
});

export const modules = pgTable('modules', {
  id: serial().primaryKey(),
  code: text().notNull(),
  name: text().notNull(),
  status: text({ enum: ['Active', 'Defunct'] })
    .notNull()
    .default('Active'),
  timestamp: text(),
});

export const moduleTypeEnum = [
  'Major',
  'Minor',
  'Core',
  'Delete',
  'Elective',
] as const;
export type ModuleType = (typeof moduleTypeEnum)[number];

export const semesterModules = pgTable('semester_modules', {
  id: serial().primaryKey(),
  moduleId: integer().references(() => modules.id), //TODO: AFTER DELETING CODE, MAKE THIS NOT NULL
  type: text({ enum: moduleTypeEnum }).notNull(),
  credits: real().notNull(),
  semesterId: integer().references(() => structureSemesters.id, {
    onDelete: 'set null',
  }),
  hidden: boolean().notNull().default(false),
  createdAt: timestamp().defaultNow(),
});

export const modulePrerequisites = pgTable(
  'module_prerequisites',
  {
    id: serial().primaryKey(),
    semesterModuleId: integer()
      .references(() => semesterModules.id, { onDelete: 'cascade' })
      .notNull(),
    prerequisiteId: integer()
      .references(() => semesterModules.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    uniquePrerequisite: unique().on(
      table.semesterModuleId,
      table.prerequisiteId
    ),
  })
);

export const terms = pgTable('terms', {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
  isActive: boolean().notNull().default(false),
  semester: integer().notNull(),
  createdAt: timestamp().defaultNow(),
});

export const registrationRequestStatusEnum = [
  'pending',
  'approved',
  'rejected',
  'partial',
  'registered',
] as const;

export const registrationRequests = pgTable(
  'registration_requests',
  {
    id: serial().primaryKey(),
    sponsorId: integer()
      .references(() => sponsors.id, { onDelete: 'cascade' })
      .notNull(),
    stdNo: bigint({ mode: 'number' })
      .references(() => students.stdNo, { onDelete: 'cascade' })
      .notNull(),
    termId: integer()
      .references(() => terms.id, { onDelete: 'cascade' })
      .notNull(),
    status: text({ enum: registrationRequestStatusEnum })
      .notNull()
      .default('pending'),
    mailSent: boolean().notNull().default(false),
    count: integer().notNull().default(1),
    semesterStatus: text({ enum: ['Active', 'Repeat'] }).notNull(),
    semesterNumber: integer().notNull(),
    message: text(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp(),
    dateApproved: timestamp(),
  },
  (table) => ({
    uniqueRegistrationRequests: unique().on(table.stdNo, table.termId),
  })
);

export const requestedModuleStatusEnum = [
  'pending',
  'registered',
  'rejected',
] as const;

export const requestedModules = pgTable('requested_modules', {
  id: serial().primaryKey(),
  moduleStatus: text({ enum: studentModuleStatusEnum })
    .notNull()
    .default('Compulsory'),
  registrationRequestId: integer()
    .references(() => registrationRequests.id, { onDelete: 'cascade' })
    .notNull(),
  semesterModuleId: integer()
    .references(() => semesterModules.id, { onDelete: 'cascade' })
    .notNull(),
  status: text({ enum: requestedModuleStatusEnum })
    .notNull()
    .default('pending'),
  createdAt: timestamp().defaultNow(),
});

export const clearanceRequestStatusEnum = [
  'pending',
  'approved',
  'rejected',
] as const;

export const clearance = pgTable('clearance', {
  id: serial().primaryKey(),
  department: text({ enum: dashboardUsers }).notNull(),
  status: text({ enum: clearanceRequestStatusEnum })
    .notNull()
    .default('pending'),
  message: text(),
  emailSent: boolean().notNull().default(false),
  respondedBy: text().references(() => users.id, { onDelete: 'cascade' }),
  responseDate: timestamp(),
  createdAt: timestamp().defaultNow(),
});

export const registrationClearance = pgTable(
  'registration_clearance',
  {
    id: serial().primaryKey(),
    registrationRequestId: integer()
      .references(() => registrationRequests.id, { onDelete: 'cascade' })
      .notNull(),
    clearanceId: integer()
      .references(() => clearance.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    uniqueRegistrationClearance: unique().on(
      table.registrationRequestId,
      table.clearanceId
    ),
  })
);

export const graduationRequests = pgTable('graduation_requests', {
  id: serial().primaryKey(),
  studentProgramId: integer()
    .references(() => studentPrograms.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  informationConfirmed: boolean().notNull().default(false),
  message: text(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
});

export const graduationClearance = pgTable(
  'graduation_clearance',
  {
    id: serial().primaryKey(),
    graduationRequestId: integer()
      .references(() => graduationRequests.id, { onDelete: 'cascade' })
      .notNull(),
    clearanceId: integer()
      .references(() => clearance.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    uniqueRegistrationClearance: unique().on(table.clearanceId),
  })
);

export const graduationListStatusEnum = [
  'created',
  'populated',
  'archived',
] as const;

export const graduationLists = pgTable('graduation_lists', {
  id: text()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text().notNull().default('Graduation List'),
  spreadsheetId: text(),
  spreadsheetUrl: text(),
  status: text({ enum: graduationListStatusEnum }).notNull().default('created'),
  createdBy: text().references(() => users.id, { onDelete: 'set null' }),
  populatedAt: timestamp(),
  createdAt: timestamp().defaultNow(),
});

export const paymentTypeEnum = ['graduation_gown', 'graduation_fee'] as const;

export const paymentReceipts = pgTable('payment_receipts', {
  id: serial().primaryKey(),
  graduationRequestId: integer()
    .references(() => graduationRequests.id, { onDelete: 'cascade' })
    .notNull(),
  paymentType: text({ enum: paymentTypeEnum }).notNull(),
  receiptNo: text().notNull().unique(),
  createdAt: timestamp().defaultNow(),
});

export const clearanceAudit = pgTable('clearance_audit', {
  id: serial().primaryKey(),
  clearanceId: integer()
    .references(() => clearance.id, { onDelete: 'cascade' })
    .notNull(),
  previousStatus: text({ enum: registrationRequestStatusEnum }),
  newStatus: text({ enum: registrationRequestStatusEnum }).notNull(),
  createdBy: text()
    .references(() => users.id, { onDelete: 'set null' })
    .notNull(),
  date: timestamp().defaultNow().notNull(),
  message: text(),
  modules: jsonb().$type<string[]>().notNull().default([]),
});

export const sponsors = pgTable('sponsors', {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
});

export const sponsoredStudents = pgTable(
  'sponsored_students',
  {
    id: serial().primaryKey(),
    sponsorId: integer()
      .references(() => sponsors.id, { onDelete: 'cascade' })
      .notNull(),
    stdNo: bigint({ mode: 'number' })
      .references(() => students.stdNo, { onDelete: 'cascade' })
      .notNull(),
    borrowerNo: text(),
    bankName: text(),
    accountNumber: text(),
    confirmed: boolean().default(false),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp(),
  },
  (table) => ({
    uniqueSponsoredStudent: unique().on(table.sponsorId, table.stdNo),
  })
);

export const sponsoredTerms = pgTable(
  'sponsored_terms',
  {
    id: serial().primaryKey(),
    sponsoredStudentId: integer()
      .references(() => sponsoredStudents.id, { onDelete: 'cascade' })
      .notNull(),
    termId: integer()
      .references(() => terms.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp(),
  },
  (table) => ({
    uniqueSponsoredTerm: unique().on(table.sponsoredStudentId, table.termId),
  })
);

export const assignedModules = pgTable('assigned_modules', {
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
  createdAt: timestamp().defaultNow(),
});

export const userSchools = pgTable(
  'user_schools',
  {
    id: serial().primaryKey(),
    userId: text()
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    schoolId: integer()
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    uniqueUserSchool: unique().on(table.userId, table.schoolId),
  })
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
    assessmentNumber: text({ enum: assessmentNumberEnum }).notNull(),
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
  })
);

export const assessmentMarks = pgTable('assessment_marks', {
  id: serial().primaryKey(),
  assessmentId: integer()
    .references(() => assessments.id, { onDelete: 'cascade' })
    .notNull(),
  stdNo: bigint({ mode: 'number' })
    .references(() => students.stdNo, { onDelete: 'cascade' })
    .notNull(),
  marks: real().notNull(),
  createdAt: timestamp().defaultNow(),
});

export const assessmentMarksAuditActionEnum = [
  'create',
  'update',
  'delete',
] as const;

export const assessmentMarksAudit = pgTable('assessment_marks_audit', {
  id: serial().primaryKey(),
  assessmentMarkId: integer().references(() => assessmentMarks.id, {
    onDelete: 'set null',
  }),
  action: text({ enum: assessmentMarksAuditActionEnum }).notNull(),
  previousMarks: real(),
  newMarks: real(),
  createdBy: text()
    .references(() => users.id, { onDelete: 'set null' })
    .notNull(),
  date: timestamp().defaultNow().notNull(),
});

export const assessmentsAuditActionEnum = [
  'create',
  'update',
  'delete',
] as const;

export const assessmentsAudit = pgTable('assessments_audit', {
  id: serial().primaryKey(),
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
  date: timestamp().defaultNow().notNull(),
});

export const moduleGrades = pgTable(
  'module_grades',
  {
    id: serial().primaryKey(),
    moduleId: integer()
      .references(() => modules.id, { onDelete: 'cascade' })
      .notNull(),
    stdNo: bigint({ mode: 'number' })
      .references(() => students.stdNo, { onDelete: 'cascade' })
      .notNull(),
    grade: text({ enum: gradeEnum }).notNull(),
    weightedTotal: real().notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
  },
  (table) => ({
    uniqueModuleStudent: unique().on(table.moduleId, table.stdNo),
  })
);

export const statementOfResultsPrints = pgTable('statement_of_results_prints', {
  id: text()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  stdNo: bigint({ mode: 'number' })
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
  printedAt: timestamp().defaultNow().notNull(),
});

export const transcriptPrints = pgTable('transcript_prints', {
  id: text()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  stdNo: bigint({ mode: 'number' })
    .references(() => students.stdNo, { onDelete: 'cascade' })
    .notNull(),
  printedBy: text()
    .references(() => users.id, { onDelete: 'set null' })
    .notNull(),
  studentName: text().notNull(),
  programName: text().notNull(),
  totalCredits: integer().notNull(),
  cgpa: real(),
  printedAt: timestamp().defaultNow().notNull(),
});

export const blockedStudents = pgTable(
  'blocked_students',
  {
    id: serial().primaryKey(),
    status: text({ enum: ['blocked', 'unblocked'] })
      .notNull()
      .default('blocked'),
    reason: text().notNull(),
    byDepartment: text({ enum: dashboardUsers }).notNull(),
    stdNo: bigint({ mode: 'number' })
      .references(() => students.stdNo, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    stdNoIdx: index('blocked_students_std_no_idx').on(table.stdNo),
  })
);

export const studentCardPrints = pgTable('student_card_prints', {
  id: text()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  receiptNo: text().notNull().unique(),
  stdNo: bigint({ mode: 'number' })
    .references(() => students.stdNo, { onDelete: 'cascade' })
    .notNull(),
  printedBy: text()
    .references(() => users.id, { onDelete: 'set null' })
    .notNull(),
  createdAt: timestamp().defaultNow(),
});

export const documents = pgTable('documents', {
  id: text()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  fileName: text().notNull(),
  type: text(),
  stdNo: bigint({ mode: 'number' })
    .references(() => students.stdNo, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp().defaultNow(),
});

export const fortinetLevelEnum = [
  'nse1',
  'nse2',
  'nse3',
  'nse4',
  'nse5',
  'nse6',
  'nse7',
  'nse8',
] as const;

export const fortinetRegistrationStatusEnum = [
  'pending',
  'approved',
  'rejected',
  'completed',
] as const;

export const fortinetRegistrations = pgTable(
  'fortinet_registrations',
  {
    id: serial().primaryKey(),
    stdNo: bigint({ mode: 'number' })
      .references(() => students.stdNo, { onDelete: 'cascade' })
      .notNull(),
    schoolId: integer()
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    level: text({ enum: fortinetLevelEnum }).notNull(),
    status: text({ enum: fortinetRegistrationStatusEnum })
      .notNull()
      .default('pending'),
    message: text(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp(),
  },
  (table) => ({
    uniqueStudentLevel: unique().on(table.stdNo, table.level),
  })
);

export const taskStatusEnum = [
  'scheduled',
  'active',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export const taskPriorityEnum = ['low', 'medium', 'high', 'urgent'] as const;

export type TaskStatus = (typeof taskStatusEnum)[number];
export type TaskPriority = (typeof taskPriorityEnum)[number];

export const tasks = pgTable(
  'tasks',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    title: text().notNull(),
    description: text(),
    status: text({ enum: taskStatusEnum }).notNull().default('active'),
    priority: text({ enum: taskPriorityEnum }).notNull().default('medium'),
    department: text({ enum: dashboardUsers }).notNull(),
    createdBy: text()
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    scheduledFor: timestamp(),
    dueDate: timestamp(),
    completedAt: timestamp(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp(),
  },
  (table) => ({
    departmentIdx: index('tasks_department_idx').on(table.department),
    statusIdx: index('tasks_status_idx').on(table.status),
    dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
  })
);

export const taskAssignments = pgTable(
  'task_assignments',
  {
    id: serial().primaryKey(),
    taskId: text()
      .references(() => tasks.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text()
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    uniqueTaskAssignment: unique().on(table.taskId, table.userId),
    userIdIdx: index('task_assignments_user_id_idx').on(table.userId),
  })
);
