import { users } from '@auth/users/_schema/users';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { studentReferrals } from './studentReferrals';

export const referralSessionType = pgEnum('referral_session_type', [
	'individual_counseling',
	'group_counseling',
	'follow_up',
	'assessment',
	'intervention',
]);

export const referralSessions = pgTable('referral_sessions', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	referralId: text()
		.notNull()
		.references(() => studentReferrals.id, { onDelete: 'cascade' }),
	sessionDate: text().notNull(),
	sessionType: referralSessionType().notNull(),
	notes: text().notNull(),
	conductedBy: text()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp().defaultNow(),
});
