import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import {
	bigint,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const studentReferralReason = pgEnum('student_referral_reason', [
	'counseling',
	'poor_performance',
	'poor_attendance',
	'misconduct',
	'health_concerns',
	'financial_issues',
	'other',
]);

export const studentReferralStatus = pgEnum('student_referral_status', [
	'pending',
	'in_progress',
	'resolved',
	'closed',
]);

export const studentReferrals = pgTable(
	'student_referrals',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		stdNo: bigint({ mode: 'number' })
			.notNull()
			.references(() => students.stdNo, { onDelete: 'cascade' }),
		reason: studentReferralReason().notNull(),
		otherReason: text(),
		description: text().notNull(),
		status: studentReferralStatus().notNull().default('pending'),
		resolutionSummary: text(),
		referredBy: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		assignedTo: text().references(() => users.id, { onDelete: 'set null' }),
		closedAt: timestamp(),
		closedBy: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		stdNoIdx: index('student_referrals_std_no_idx').on(table.stdNo),
		statusIdx: index('student_referrals_status_idx').on(table.status),
		referredByIdx: index('student_referrals_referred_by_idx').on(
			table.referredBy
		),
	})
);
