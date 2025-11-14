import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { paymentType } from './enums';
import { clearance } from './registration';
import { studentPrograms } from './students';

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
