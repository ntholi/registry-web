import { paymentReceipts } from '@finance/_database';
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
import { graduationDates } from './graduations';
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
		graduationDateId: integer().references(() => graduationDates.id, {
			onDelete: 'set null',
		}),
		informationConfirmed: boolean().notNull().default(false),
		message: text(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		studentProgramIdIdx: index('fk_graduation_requests_student_program_id').on(
			table.studentProgramId
		),
		graduationDateIdIdx: index('fk_graduation_requests_graduation_date_id').on(
			table.graduationDateId
		),
	})
);

export const graduationRequestReceipts = pgTable(
	'graduation_request_receipts',
	{
		graduationRequestId: integer()
			.references(() => graduationRequests.id, { onDelete: 'cascade' })
			.notNull(),
		receiptId: text()
			.references(() => paymentReceipts.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		pk: unique().on(table.graduationRequestId, table.receiptId),
		graduationRequestIdIdx: index(
			'fk_graduation_request_receipts_graduation_request_id'
		).on(table.graduationRequestId),
		receiptIdIdx: index('fk_graduation_request_receipts_receipt_id').on(
			table.receiptId
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
