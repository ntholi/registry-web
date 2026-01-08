import { programs } from '@academic/_database';
import { users } from '@auth/_database';
import { paymentReceipts } from '@finance/_database';
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { applicants } from './applicants';
import { applicationStatusEnum, paymentStatusEnum } from './enums';
import { intakePeriods } from './intake-periods';

export const applications = pgTable(
	'applications',
	{
		id: serial().primaryKey(),
		applicantId: text()
			.references(() => applicants.id, { onDelete: 'cascade' })
			.notNull(),
		intakePeriodId: integer()
			.references(() => intakePeriods.id, { onDelete: 'restrict' })
			.notNull(),
		firstChoiceProgramId: integer()
			.references(() => programs.id, { onDelete: 'restrict' })
			.notNull(),
		secondChoiceProgramId: integer().references(() => programs.id, {
			onDelete: 'restrict',
		}),
		status: applicationStatusEnum().notNull().default('submitted'),
		paymentStatus: paymentStatusEnum().notNull().default('unpaid'),
		createdBy: text().references(() => users.id, { onDelete: 'set null' }),
		applicationDate: timestamp().defaultNow(),
		updatedAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicantIntakeUnique: unique('uq_applications_applicant_intake').on(
			table.applicantId,
			table.intakePeriodId
		),
		applicantIdx: index('fk_applications_applicant').on(table.applicantId),
		intakeIdx: index('fk_applications_intake').on(table.intakePeriodId),
		firstChoiceIdx: index('fk_applications_first_choice').on(
			table.firstChoiceProgramId
		),
		secondChoiceIdx: index('fk_applications_second_choice').on(
			table.secondChoiceProgramId
		),
		statusIdx: index('idx_applications_status').on(table.status),
		paymentStatusIdx: index('idx_applications_payment_status').on(
			table.paymentStatus
		),
	})
);

export const applicationReceipts = pgTable(
	'application_receipts',
	{
		id: serial().primaryKey(),
		applicationId: integer()
			.references(() => applications.id, { onDelete: 'cascade' })
			.notNull(),
		receiptId: text()
			.references(() => paymentReceipts.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicationIdx: index('fk_application_receipts_app').on(
			table.applicationId
		),
		receiptIdx: index('fk_application_receipts_receipt').on(table.receiptId),
	})
);

export const applicationStatusHistory = pgTable(
	'application_status_history',
	{
		id: serial().primaryKey(),
		applicationId: integer()
			.references(() => applications.id, { onDelete: 'cascade' })
			.notNull(),
		fromStatus: applicationStatusEnum(),
		toStatus: applicationStatusEnum().notNull(),
		changedBy: text().references(() => users.id, { onDelete: 'set null' }),
		notes: text(),
		rejectionReason: text(),
		changedAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicationIdx: index('fk_app_status_history_app').on(table.applicationId),
		changedByIdx: index('fk_app_status_history_user').on(table.changedBy),
	})
);

export const applicationNotes = pgTable(
	'application_notes',
	{
		id: serial().primaryKey(),
		applicationId: integer()
			.references(() => applications.id, { onDelete: 'cascade' })
			.notNull(),
		content: text().notNull(),
		createdBy: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicationIdx: index('fk_application_notes_app').on(table.applicationId),
		createdByIdx: index('fk_application_notes_user').on(table.createdBy),
	})
);
