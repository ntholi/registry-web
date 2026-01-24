import { programs } from '@academic/schools/_schema/programs';
import { applicants } from '@admissions/applicants/_schema/applicants';
import { intakePeriods } from '@admissions/intake-periods/_schema/intakePeriods';
import { users } from '@auth/users/_schema/users';
import { sql } from 'drizzle-orm';
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';

export const applicationStatusEnum = pgEnum('application_status', [
	'draft',
	'submitted',
	'under_review',
	'accepted_first_choice',
	'accepted_second_choice',
	'rejected',
	'waitlisted',
]);
export type ApplicationStatus =
	(typeof applicationStatusEnum.enumValues)[number];

export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'paid']);
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

export const applications = pgTable(
	'applications',
	{
		id: text().primaryKey().default(sql`nextval('application_id_seq')::text`),
		applicantId: text()
			.references(() => applicants.id, { onDelete: 'cascade' })
			.notNull(),
		intakePeriodId: text()
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
