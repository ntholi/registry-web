import {
	bigint,
	boolean,
	char,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { semesterModules, terms } from '@/modules/academic/database';
import { dashboardUsers, users } from '@/modules/auth/database';
import {
	clearanceRequestStatus,
	registrationRequestStatus,
	requestedModuleStatus,
	semesterStatusForRegistration,
	studentModuleStatus,
} from './enums';
import { students } from './students';

export const registrationRequests = pgTable(
	'registration_requests',
	{
		id: serial().primaryKey(),
		sponsoredStudentId: integer().notNull(),
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
