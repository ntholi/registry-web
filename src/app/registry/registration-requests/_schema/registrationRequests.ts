import { users } from '@auth/users/_schema/users';
import { sql } from 'drizzle-orm';
import {
	bigint,
	boolean,
	char,
	check,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { studentSemesters } from '../../students/_schema/studentSemesters';
import { students } from '../../students/_schema/students';
import { terms } from '../../terms/_schema/terms';

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
		dateRegistered: timestamp(),
		deletedAt: timestamp(),
		deletedBy: text().references(() => users.id, { onDelete: 'set null' }),
		studentSemesterId: integer().references(() => studentSemesters.id, {
			onDelete: 'set null',
		}),
	},
	(table) => ({
		stdNoIdx: index('fk_registration_requests_std_no').on(table.stdNo),
		termIdIdx: index('fk_registration_requests_term_id').on(table.termId),
		statusIdx: index('idx_registration_requests_status').on(table.status),
		sponsoredStudentIdIdx: index(
			'fk_registration_requests_sponsored_student_id'
		).on(table.sponsoredStudentId),
		studentSemesterIdIdx: index(
			'fk_registration_requests_student_semester_id'
		).on(table.studentSemesterId),
		semesterNumberNotBlank: check(
			'chk_registration_requests_semester_number_not_blank',
			sql`trim(${table.semesterNumber}) <> ''`
		),
	})
);
