import { sql } from 'drizzle-orm';
import {
	bigint,
	boolean,
	char,
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
	varchar,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import type { AdapterAccountType } from 'next-auth/adapters';

export const dashboardUsers = pgEnum('dashboard_users', [
	'finance',
	'registry',
	'library',
	'resource',
	'academic',
	'student_services',
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
	'student_services',
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

export const gender = pgEnum('gender', ['Male', 'Female', 'Unknown']);
export const maritalStatusEnum = pgEnum('marital_status', [
	'Single',
	'Married',
	'Divorced',
	'Windowed',
	'Other',
]);

export const studentStatus = pgEnum('student_status', [
	'Active',
	'Applied',
	'Deceased',
	'Deleted',
	'Graduated',
	'Suspended',
	'Terminated',
	'Withdrawn',
]);

export const students = pgTable(
	'students',
	{
		stdNo: bigint({ mode: 'number' }).primaryKey(),
		name: text().notNull(),
		nationalId: text().notNull(),
		status: studentStatus().notNull().default('Active'),
		dateOfBirth: timestamp({ mode: 'date' }),
		phone1: text(),
		phone2: text(),
		gender: gender(),
		maritalStatus: maritalStatusEnum(),
		country: text(),
		race: text(),
		nationality: text(),
		birthPlace: text(),
		religion: text(),
		userId: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		nameTrigramIdx: index('idx_students_name_trgm').using(
			'gin',
			sql`${table.name} gin_trgm_ops`
		),
		userIdIdx: index('fk_students_user_id').on(table.userId),
	})
);

export const educationType = pgEnum('education_type', [
	'Primary',
	'Secondary',
	'Tertiary',
]);

export const educationLevel = pgEnum('education_level', [
	'JCE',
	'BJCE',
	'BGGSE',
	'BGCSE',
	'LGCSE',
	'IGCSE',
	'O-Levels',
	'A-Levels',
	'Matriculation',
	'Cambridge Oversea School Certificate',
	'Certificate',
	'Diploma',
	'Degree',
	'Masters',
	'Doctorate',
	'Others',
]);

export const studentEducation = pgTable(
	'student_education',
	{
		id: serial().primaryKey(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		schoolName: text().notNull(),
		type: educationType(),
		level: educationLevel(),
		startDate: timestamp({ mode: 'date' }),
		endDate: timestamp({ mode: 'date' }),
		createdAt: timestamp().notNull().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_student_education_std_no').on(table.stdNo),
		schoolNameIdx: index('idx_student_education_school_name').on(
			table.schoolName
		),
	})
);

export const nextOfKinRelationship = pgEnum('next_of_kin_relationship', [
	'Mother',
	'Father',
	'Brother',
	'Sister',
	'Child',
	'Spouse',
	'Guardian',
	'Husband',
	'Wife',
	'Permanent',
	'Self',
	'Other',
]);

export const nextOfKins = pgTable(
	'next_of_kins',
	{
		id: serial().primaryKey(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		name: text().notNull(),
		relationship: nextOfKinRelationship().notNull(),
		phone: text(),
		email: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_next_of_kins_std_no').on(table.stdNo),
	})
);

export const programStatus = pgEnum('program_status', [
	'Active',
	'Changed',
	'Completed',
	'Deleted',
	'Inactive',
]);
export type StudentProgramStatus = (typeof programStatus.enumValues)[number];

export const studentPrograms = pgTable(
	'student_programs',
	{
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
		status: programStatus().notNull(),
		assistProvider: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_student_programs_std_no').on(table.stdNo),
		statusIdx: index('idx_student_programs_status').on(table.status),
		structureIdIdx: index('fk_student_programs_structure_id').on(
			table.structureId
		),
		stdNoStatusIdx: index('idx_student_programs_std_no_status').on(
			table.stdNo,
			table.status
		),
	})
);

export const semesterStatus = pgEnum('semester_status', [
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

export type SemesterStatus = (typeof semesterStatus.enumValues)[number];
export const studentSemesters = pgTable(
	'student_semesters',
	{
		id: serial().primaryKey(),
		term: text().notNull(),
		structureSemesterId: integer()
			.references(() => structureSemesters.id, { onDelete: 'cascade' })
			.notNull(),
		status: semesterStatus().notNull(),
		studentProgramId: integer()
			.references(() => studentPrograms.id, { onDelete: 'cascade' })
			.notNull(),
		sponsorId: integer().references(() => sponsors.id, {
			onDelete: 'set null',
		}),
		cafDate: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		studentProgramIdIdx: index('fk_student_semesters_student_program_id').on(
			table.studentProgramId
		),
		structureSemesterIdIdx: index(
			'fk_student_semesters_structure_semester_id'
		).on(table.structureSemesterId),
		termIdx: index('idx_student_semesters_term').on(table.term),
		statusIdx: index('idx_student_semesters_status').on(table.status),
		sponsorIdIdx: index('fk_student_semesters_sponsor_id').on(table.sponsorId),
	})
);

export const studentModuleStatus = pgEnum('student_module_status', [
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

export const grade = pgEnum('grade', [
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

export type StudentModuleStatus =
	(typeof studentModuleStatus.enumValues)[number];
export type Grade = (typeof grade.enumValues)[number];

export const studentModules = pgTable(
	'student_modules',
	{
		id: serial().primaryKey(),
		semesterModuleId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		status: studentModuleStatus().notNull(),
		marks: text().notNull(),
		grade: grade().notNull(),
		studentSemesterId: integer()
			.references(() => studentSemesters.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		studentSemesterIdIdx: index('fk_student_modules_student_semester_id').on(
			table.studentSemesterId
		),
		semesterModuleIdIdx: index('fk_student_modules_semester_module_id').on(
			table.semesterModuleId
		),
		statusIdx: index('idx_student_modules_status').on(table.status),
	})
);

export const schools = pgTable('schools', {
	id: serial().primaryKey(),
	code: text().notNull().unique(),
	name: text().notNull(),
	isActive: boolean().notNull().default(true),
	createdAt: timestamp().defaultNow(),
});

export const programLevelEnum = pgEnum('program_level', [
	'certificate',
	'diploma',
	'degree',
]);
export const programs = pgTable(
	'programs',
	{
		id: serial().primaryKey(),
		code: text().notNull().unique(),
		name: text().notNull(),
		level: programLevelEnum().notNull(),
		schoolId: integer()
			.references(() => schools.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		schoolIdIdx: index('fk_programs_school_id').on(table.schoolId),
	})
);

export const structures = pgTable(
	'structures',
	{
		id: serial().primaryKey(),
		code: text().notNull().unique(),
		desc: text(),
		programId: integer()
			.references(() => programs.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		programIdIdx: index('fk_structures_program_id').on(table.programId),
	})
);

export const structureSemesters = pgTable('structure_semesters', {
	id: serial().primaryKey(),
	structureId: integer()
		.references(() => structures.id, { onDelete: 'cascade' })
		.notNull(),
	semesterNumber: char({ length: 2 }).notNull(),
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

export const moduleType = pgEnum('module_type', [
	'Major',
	'Minor',
	'Core',
	'Delete',
	'Elective',
]);
export type ModuleType = (typeof moduleType.enumValues)[number];

export const semesterModules = pgTable(
	'semester_modules',
	{
		id: serial().primaryKey(),
		moduleId: integer()
			.notNull()
			.references(() => modules.id),
		type: moduleType().notNull(),
		credits: real().notNull(),
		semesterId: integer().references(() => structureSemesters.id, {
			onDelete: 'set null',
		}),
		hidden: boolean().notNull().default(false),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		moduleIdIdx: index('fk_semester_modules_module_id').on(table.moduleId),
		semesterIdIdx: index('fk_semester_modules_semester_id').on(
			table.semesterId
		),
	})
);

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

export const registrationRequestStatus = pgEnum('registration_request_status', [
	'pending',
	'approved',
	'rejected',
	'partial',
	'registered',
]);

export const semesterStatusForRegistration = pgEnum(
	'semester_status_for_registration',
	['Active', 'Repeat']
);

export const registrationRequests = pgTable(
	'registration_requests',
	{
		id: serial().primaryKey(),
		sponsoredStudentId: integer()
			.references(() => sponsoredStudents.id, { onDelete: 'cascade' })
			.notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		termId: integer()
			.references(() => terms.id, { onDelete: 'cascade' })
			.notNull(),
		status: registrationRequestStatus().notNull().default('pending'),
		mailSent: boolean().notNull().default(false),
		count: integer().notNull().default(1),
		semesterStatus: semesterStatusForRegistration().notNull(),
		semesterNumber: char({ length: 2 }).notNull(),
		message: text(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
		dateApproved: timestamp(),
	},
	(table) => ({
		uniqueRegistrationRequests: unique().on(table.stdNo, table.termId),
		stdNoIdx: index('fk_registration_requests_std_no').on(table.stdNo),
		termIdIdx: index('fk_registration_requests_term_id').on(table.termId),
		statusIdx: index('idx_registration_requests_status').on(table.status),
		sponsoredStudentIdIdx: index(
			'fk_registration_requests_sponsored_student_id'
		).on(table.sponsoredStudentId),
	})
);

export const requestedModuleStatus = pgEnum('requested_module_status', [
	'pending',
	'registered',
	'rejected',
]);

export const requestedModules = pgTable(
	'requested_modules',
	{
		id: serial().primaryKey(),
		moduleStatus: studentModuleStatus().notNull().default('Compulsory'),
		registrationRequestId: integer()
			.references(() => registrationRequests.id, { onDelete: 'cascade' })
			.notNull(),
		semesterModuleId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		status: requestedModuleStatus().notNull().default('pending'),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		registrationRequestIdIdx: index(
			'fk_requested_modules_registration_request_id'
		).on(table.registrationRequestId),
		semesterModuleIdIdx: index('fk_requested_modules_semester_module_id').on(
			table.semesterModuleId
		),
	})
);

export const clearanceRequestStatus = pgEnum('clearance_request_status', [
	'pending',
	'approved',
	'rejected',
]);

export const clearance = pgTable(
	'clearance',
	{
		id: serial().primaryKey(),
		department: dashboardUsers().notNull(),
		status: clearanceRequestStatus().notNull().default('pending'),
		message: text(),
		emailSent: boolean().notNull().default(false),
		respondedBy: text().references(() => users.id, { onDelete: 'cascade' }),
		responseDate: timestamp(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		departmentIdx: index('idx_clearance_department').on(table.department),
		statusIdx: index('idx_clearance_status').on(table.status),
	})
);

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
		registrationRequestIdIdx: index(
			'fk_registration_clearance_registration_request_id'
		).on(table.registrationRequestId),
		clearanceIdIdx: index('fk_registration_clearance_clearance_id').on(
			table.clearanceId
		),
	})
);

export const graduationRequests = pgTable(
	'graduation_requests',
	{
		id: serial().primaryKey(),
		studentProgramId: integer()
			.references(() => studentPrograms.id, { onDelete: 'cascade' })
			.unique()
			.notNull(),
		informationConfirmed: boolean().notNull().default(false),
		message: text(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		studentProgramIdIdx: index('fk_graduation_requests_student_program_id').on(
			table.studentProgramId
		),
	})
);

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
		graduationRequestIdIdx: index(
			'fk_graduation_clearance_graduation_request_id'
		).on(table.graduationRequestId),
		clearanceIdIdx: index('fk_graduation_clearance_clearance_id').on(
			table.clearanceId
		),
	})
);

export const paymentType = pgEnum('payment_type', [
	'graduation_gown',
	'graduation_fee',
]);

export const paymentReceipts = pgTable(
	'payment_receipts',
	{
		id: serial().primaryKey(),
		graduationRequestId: integer()
			.references(() => graduationRequests.id, { onDelete: 'cascade' })
			.notNull(),
		paymentType: paymentType().notNull(),
		receiptNo: text().notNull().unique(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		graduationRequestIdIdx: index(
			'fk_payment_receipts_graduation_request_id'
		).on(table.graduationRequestId),
	})
);

export const clearanceAudit = pgTable(
	'clearance_audit',
	{
		id: serial().primaryKey(),
		clearanceId: integer()
			.references(() => clearance.id, { onDelete: 'cascade' })
			.notNull(),
		previousStatus: registrationRequestStatus(),
		newStatus: registrationRequestStatus().notNull(),
		createdBy: text()
			.references(() => users.id, { onDelete: 'set null' })
			.notNull(),
		date: timestamp().defaultNow().notNull(),
		message: text(),
		modules: jsonb().$type<string[]>().notNull().default([]),
	},
	(table) => ({
		clearanceIdIdx: index('fk_clearance_audit_clearance_id').on(
			table.clearanceId
		),
		createdByIdx: index('fk_clearance_audit_created_by').on(table.createdBy),
	})
);

export const sponsors = pgTable('sponsors', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	code: varchar({ length: 10 }).notNull().unique(),
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
		sponsorIdIdx: index('fk_sponsored_students_sponsor_id').on(table.sponsorId),
		stdNoIdx: index('fk_sponsored_students_std_no').on(table.stdNo),
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
		sponsoredStudentIdIdx: index('fk_sponsored_terms_sponsored_student_id').on(
			table.sponsoredStudentId
		),
		termIdIdx: index('fk_sponsored_terms_term_id').on(table.termId),
	})
);

export const assignedModules = pgTable(
	'assigned_modules',
	{
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
	},
	(table) => ({
		userIdIdx: index('fk_assigned_modules_user_id').on(table.userId),
		termIdIdx: index('fk_assigned_modules_term_id').on(table.termId),
		semesterModuleIdIdx: index('fk_assigned_modules_semester_module_id').on(
			table.semesterModuleId
		),
	})
);

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
		userIdIdx: index('fk_user_schools_user_id').on(table.userId),
		schoolIdIdx: index('fk_user_schools_school_id').on(table.schoolId),
	})
);

export const assessmentNumber = pgEnum('assessment_number', [
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
		assessmentNumber: assessmentNumber().notNull(),
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
		moduleIdIdx: index('fk_assessments_module_id').on(table.moduleId),
		termIdIdx: index('fk_assessments_term_id').on(table.termId),
	})
);

export const assessmentMarks = pgTable(
	'assessment_marks',
	{
		id: serial().primaryKey(),
		assessmentId: integer()
			.references(() => assessments.id, { onDelete: 'cascade' })
			.notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		marks: real().notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		assessmentIdIdx: index('fk_assessment_marks_assessment_id').on(
			table.assessmentId
		),
		stdNoIdx: index('fk_assessment_marks_std_no').on(table.stdNo),
		assessmentIdStdNoIdx: index('idx_assessment_marks_assessment_id_std_no').on(
			table.assessmentId,
			table.stdNo
		),
	})
);

export const assessmentMarksAuditAction = pgEnum(
	'assessment_marks_audit_action',
	['create', 'update', 'delete']
);

export const assessmentMarksAudit = pgTable(
	'assessment_marks_audit',
	{
		id: serial().primaryKey(),
		assessmentMarkId: integer().references(() => assessmentMarks.id, {
			onDelete: 'set null',
		}),
		action: assessmentMarksAuditAction().notNull(),
		previousMarks: real(),
		newMarks: real(),
		createdBy: text()
			.references(() => users.id, { onDelete: 'set null' })
			.notNull(),
		date: timestamp().defaultNow().notNull(),
	},
	(table) => ({
		assessmentMarkIdIdx: index(
			'fk_assessment_marks_audit_assessment_mark_id'
		).on(table.assessmentMarkId),
		createdByIdx: index('fk_assessment_marks_audit_created_by').on(
			table.createdBy
		),
	})
);

export const assessmentsAuditAction = pgEnum('assessments_audit_action', [
	'create',
	'update',
	'delete',
]);

export const assessmentsAudit = pgTable(
	'assessments_audit',
	{
		id: serial().primaryKey(),
		assessmentId: integer().references(() => assessments.id, {
			onDelete: 'set null',
		}),
		action: assessmentsAuditAction().notNull(),
		previousAssessmentNumber: assessmentNumber(),
		newAssessmentNumber: assessmentNumber(),
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
	},
	(table) => ({
		assessmentIdIdx: index('fk_assessments_audit_assessment_id').on(
			table.assessmentId
		),
		createdByIdx: index('fk_assessments_audit_created_by').on(table.createdBy),
	})
);

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
		grade: grade().notNull(),
		weightedTotal: real().notNull(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueModuleStudent: unique().on(table.moduleId, table.stdNo),
	})
);

export const statementOfResultsPrints = pgTable(
	'statement_of_results_prints',
	{
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
	},
	(table) => ({
		stdNoIdx: index('fk_statement_of_results_prints_std_no').on(table.stdNo),
		printedByIdx: index('fk_statement_of_results_prints_printed_by').on(
			table.printedBy
		),
	})
);

export const transcriptPrints = pgTable(
	'transcript_prints',
	{
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
	},
	(table) => ({
		stdNoIdx: index('fk_transcript_prints_std_no').on(table.stdNo),
		printedByIdx: index('fk_transcript_prints_printed_by').on(table.printedBy),
	})
);

export const blockedStudentStatusEnum = pgEnum('blocked_student_status', [
	'blocked',
	'unblocked',
]);

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
		stdNoIdx: index('fk_blocked_students_std_no').on(table.stdNo),
	})
);

export const studentCardPrints = pgTable(
	'student_card_prints',
	{
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
	},
	(table) => ({
		stdNoIdx: index('fk_student_card_prints_std_no').on(table.stdNo),
		printedByIdx: index('fk_student_card_prints_printed_by').on(
			table.printedBy
		),
	})
);

export const documents = pgTable(
	'documents',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		fileName: text().notNull(),
		type: text(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_documents_std_no').on(table.stdNo),
	})
);

export const fortinetLevel = pgEnum('fortinet_level', [
	'nse1',
	'nse2',
	'nse3',
	'nse4',
	'nse5',
	'nse6',
	'nse7',
	'nse8',
]);

export const fortinetRegistrationStatus = pgEnum(
	'fortinet_registration_status',
	['pending', 'approved', 'rejected', 'completed']
);

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
		level: fortinetLevel().notNull(),
		status: fortinetRegistrationStatus().notNull().default('pending'),
		message: text(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		uniqueStudentLevel: unique().on(table.stdNo, table.level),
		stdNoIdx: index('fk_fortinet_registrations_std_no').on(table.stdNo),
		schoolIdIdx: index('fk_fortinet_registrations_school_id').on(
			table.schoolId
		),
		statusIdx: index('idx_fortinet_registrations_status').on(table.status),
	})
);

export const taskStatus = pgEnum('task_status', [
	'scheduled',
	'active',
	'in_progress',
	'completed',
	'cancelled',
]);

export const taskPriority = pgEnum('task_priority', [
	'low',
	'medium',
	'high',
	'urgent',
]);

export type TaskStatus = (typeof taskStatus.enumValues)[number];
export type TaskPriority = (typeof taskPriority.enumValues)[number];

export const tasks = pgTable(
	'tasks',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		title: text().notNull(),
		description: text(),
		status: taskStatus().notNull().default('active'),
		priority: taskPriority().notNull().default('medium'),
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
		userIdIdx: index('fk_task_assignments_user_id').on(table.userId),
	})
);
