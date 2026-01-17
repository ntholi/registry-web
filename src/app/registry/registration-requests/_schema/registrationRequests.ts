import {
	bigint,
	boolean,
	char,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { students, terms } from '@/core/database';

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
