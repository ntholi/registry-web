import { sql } from 'drizzle-orm';
import {
	bigint,
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
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

export const dashboardUsers = pgEnum('dashboard_users', [
	'finance',
	'registry',
	'library',
	'resource',
	'academic',
	'admin',
]);
export type DashboardUser = (typeof dashboardUsers.enumValues)[number];
export const userRoles = pgEnum('user_roles', [
	'user',
	'student',
	'finance',
	'registry',
	'library',
	'resource',
	'academic',
	'admin',
]);
export type UserRole = (typeof userRoles.enumValues)[number];

export const userPositions = pgEnum('user_positions', [
	'manager',
	'program_leader',
	'principal_lecturer',
	'year_leader',
	'lecturer',
	'admin',
]);
export type UserPosition = (typeof userPositions.enumValues)[number];

export const users = pgTable('users', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text(),
	role: userRoles().notNull().default('user'),
	position: userPositions(),
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

export const signupStatusEnum = pgEnum('signup_status', ['pending', 'approved', 'rejected']);
export const signups = pgTable('signups', {
	userId: text()
		.primaryKey()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text().notNull(),
	stdNo: text().notNull(),
	status: signupStatusEnum().notNull().default('pending'),
	message: text().default('Pending approval'),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp(),
});

export const genderEnum = pgEnum('gender', ['Male', 'Female', 'Unknown']);
export const maritalStatusEnum = pgEnum('marital_status', [
	'Single',
	'Married',
	'Divorced',
	'Windowed',
	'Other',
]);

export const students = pgTable(
	'students',
	{
		stdNo: bigint({ mode: 'number' }).primaryKey(),
		name: text().notNull(),
		nationalId: text().notNull(),
		sem: integer().notNull(), //TODO: Remove this
		dateOfBirth: timestamp({ mode: 'date' }),
		phone1: text(),
		phone2: text(),
		gender: genderEnum(),
		maritalStatus: maritalStatusEnum(),
		religion: text(),
		userId: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		nameTrigramIdx: index('idx_students_name_trgm').using('gin', sql`${table.name} gin_trgm_ops`),
	})
);

export const programStatusEnum = pgEnum('program_status', [
	'Active',
	'Changed',
	'Completed',
	'Deleted',
	'Inactive',
]);
export type StudentProgramStatus = (typeof programStatusEnum.enumValues)[number];

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
	status: programStatusEnum().notNull(),
	assistProvider: text(),
	createdAt: timestamp().defaultNow(),
});

export const semesterStatusEnum = pgEnum('semester_status', [
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
]);

export type SemesterStatus = (typeof semesterStatusEnum.enumValues)[number];
export const studentSemesters = pgTable('student_semesters', {
	id: serial().primaryKey(),
	term: text().notNull(),
	semesterNumber: integer(),
	status: semesterStatusEnum().notNull(),
	studentProgramId: integer()
		.references(() => studentPrograms.id, { onDelete: 'cascade' })
		.notNull(),
	cafDate: text(),
	createdAt: timestamp().defaultNow(),
});

export const studentModuleStatusEnum = pgEnum('student_module_status', [
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
]);

export const gradeEnum = pgEnum('grade', [
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
	'DEF',
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
]);

export type StudentModuleStatus = (typeof studentModuleStatusEnum.enumValues)[number];
export type Grade = (typeof gradeEnum.enumValues)[number];

export const studentModules = pgTable('student_modules', {
	id: serial().primaryKey(),
	semesterModuleId: integer()
		.references(() => semesterModules.id, { onDelete: 'cascade' })
		.notNull(),
	status: studentModuleStatusEnum().notNull(),
	marks: text().notNull(),
	grade: gradeEnum().notNull(),
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

export const programLevelEnum = pgEnum('program_level', ['certificate', 'diploma', 'degree']);
export const programs = pgTable('programs', {
	id: serial().primaryKey(),
	code: text().notNull().unique(),
	name: text().notNull(),
	level: programLevelEnum().notNull(),
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

export const moduleStatusEnum = pgEnum('module_status', ['Active', 'Defunct']);

export const modules = pgTable('modules', {
	id: serial().primaryKey(),
	code: text().notNull(),
	name: text().notNull(),
	status: moduleStatusEnum().notNull().default('Active'),
	timestamp: text(),
});

export const moduleTypeEnum = pgEnum('module_type', [
	'Major',
	'Minor',
	'Core',
	'Delete',
	'Elective',
]);
export type ModuleType = (typeof moduleTypeEnum.enumValues)[number];

export const semesterModules = pgTable('semester_modules', {
	id: serial().primaryKey(),
	moduleId: integer().references(() => modules.id), //TODO: AFTER DELETING CODE, MAKE THIS NOT NULL
	type: moduleTypeEnum().notNull(),
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
		uniquePrerequisite: unique().on(table.semesterModuleId, table.prerequisiteId),
	})
);

export const terms = pgTable('terms', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	isActive: boolean().notNull().default(false),
	semester: integer().notNull(),
	createdAt: timestamp().defaultNow(),
});

export const registrationRequestStatusEnum = pgEnum('registration_request_status', [
	'pending',
	'approved',
	'rejected',
	'partial',
	'registered',
]);

export const semesterStatusForRegistrationEnum = pgEnum('semester_status_for_registration', [
	'Active',
	'Repeat',
]);

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
		status: registrationRequestStatusEnum().notNull().default('pending'),
		mailSent: boolean().notNull().default(false),
		count: integer().notNull().default(1),
		semesterStatus: semesterStatusForRegistrationEnum().notNull(),
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

export const requestedModuleStatusEnum = pgEnum('requested_module_status', [
	'pending',
	'registered',
	'rejected',
]);

export const requestedModules = pgTable('requested_modules', {
	id: serial().primaryKey(),
	moduleStatus: studentModuleStatusEnum().notNull().default('Compulsory'),
	registrationRequestId: integer()
		.references(() => registrationRequests.id, { onDelete: 'cascade' })
		.notNull(),
	semesterModuleId: integer()
		.references(() => semesterModules.id, { onDelete: 'cascade' })
		.notNull(),
	status: requestedModuleStatusEnum().notNull().default('pending'),
	createdAt: timestamp().defaultNow(),
});

export const clearanceRequestStatusEnum = pgEnum('clearance_request_status', [
	'pending',
	'approved',
	'rejected',
]);

export const clearance = pgTable('clearance', {
	id: serial().primaryKey(),
	department: dashboardUsers().notNull(),
	status: clearanceRequestStatusEnum().notNull().default('pending'),
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
		uniqueRegistrationClearance: unique().on(table.registrationRequestId, table.clearanceId),
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

export const graduationListStatusEnum = pgEnum('graduation_list_status', [
	'created',
	'populated',
	'archived',
]);

export const graduationLists = pgTable('graduation_lists', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull().default('Graduation List'),
	spreadsheetId: text(),
	spreadsheetUrl: text(),
	status: graduationListStatusEnum().notNull().default('created'),
	createdBy: text().references(() => users.id, { onDelete: 'set null' }),
	populatedAt: timestamp(),
	createdAt: timestamp().defaultNow(),
});

export const paymentTypeEnum = pgEnum('payment_type', ['graduation_gown', 'graduation_fee']);

export const paymentReceipts = pgTable('payment_receipts', {
	id: serial().primaryKey(),
	graduationRequestId: integer()
		.references(() => graduationRequests.id, { onDelete: 'cascade' })
		.notNull(),
	paymentType: paymentTypeEnum().notNull(),
	receiptNo: text().notNull().unique(),
	createdAt: timestamp().defaultNow(),
});

export const clearanceAudit = pgTable('clearance_audit', {
	id: serial().primaryKey(),
	clearanceId: integer()
		.references(() => clearance.id, { onDelete: 'cascade' })
		.notNull(),
	previousStatus: registrationRequestStatusEnum(),
	newStatus: registrationRequestStatusEnum().notNull(),
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

export const assessmentNumberEnum = pgEnum('assessment_number', [
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
]);

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
		assessmentNumber: assessmentNumberEnum().notNull(),
		assessmentType: text().notNull(),
		totalMarks: real().notNull(),
		weight: real().notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueAssessmentModule: unique().on(table.moduleId, table.assessmentNumber, table.termId),
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

export const assessmentMarksAuditActionEnum = pgEnum('assessment_marks_audit_action', [
	'create',
	'update',
	'delete',
]);

export const assessmentMarksAudit = pgTable('assessment_marks_audit', {
	id: serial().primaryKey(),
	assessmentMarkId: integer().references(() => assessmentMarks.id, {
		onDelete: 'set null',
	}),
	action: assessmentMarksAuditActionEnum().notNull(),
	previousMarks: real(),
	newMarks: real(),
	createdBy: text()
		.references(() => users.id, { onDelete: 'set null' })
		.notNull(),
	date: timestamp().defaultNow().notNull(),
});

export const assessmentsAuditActionEnum = pgEnum('assessments_audit_action', [
	'create',
	'update',
	'delete',
]);

export const assessmentsAudit = pgTable('assessments_audit', {
	id: serial().primaryKey(),
	assessmentId: integer().references(() => assessments.id, {
		onDelete: 'set null',
	}),
	action: assessmentsAuditActionEnum().notNull(),
	previousAssessmentNumber: assessmentNumberEnum(),
	newAssessmentNumber: assessmentNumberEnum(),
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
		grade: gradeEnum().notNull(),
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

export const blockedStudentStatusEnum = pgEnum('blocked_student_status', ['blocked', 'unblocked']);

export const blockedStudents = pgTable(
	'blocked_students',
	{
		id: serial().primaryKey(),
		status: blockedStudentStatusEnum().notNull().default('blocked'),
		reason: text().notNull(),
		byDepartment: dashboardUsers().notNull(),
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

export const fortinetLevelEnum = pgEnum('fortinet_level', [
	'nse1',
	'nse2',
	'nse3',
	'nse4',
	'nse5',
	'nse6',
	'nse7',
	'nse8',
]);

export const fortinetRegistrationStatusEnum = pgEnum('fortinet_registration_status', [
	'pending',
	'approved',
	'rejected',
	'completed',
]);

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
		level: fortinetLevelEnum().notNull(),
		status: fortinetRegistrationStatusEnum().notNull().default('pending'),
		message: text(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		uniqueStudentLevel: unique().on(table.stdNo, table.level),
	})
);

export const taskStatusEnum = pgEnum('task_status', [
	'scheduled',
	'active',
	'in_progress',
	'completed',
	'cancelled',
]);

export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);

export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];

export const tasks = pgTable(
	'tasks',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		title: text().notNull(),
		description: text(),
		status: taskStatusEnum().notNull().default('active'),
		priority: taskPriorityEnum().notNull().default('medium'),
		department: dashboardUsers().notNull(),
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
