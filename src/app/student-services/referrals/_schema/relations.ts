import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { referralSessions } from './referralSessions';
import { studentReferrals } from './studentReferrals';

export const studentReferralsRelations = relations(
	studentReferrals,
	({ one, many }) => ({
		student: one(students, {
			fields: [studentReferrals.stdNo],
			references: [students.stdNo],
		}),
		referrer: one(users, {
			fields: [studentReferrals.referredBy],
			references: [users.id],
			relationName: 'referrer',
		}),
		assignee: one(users, {
			fields: [studentReferrals.assignedTo],
			references: [users.id],
			relationName: 'assignee',
		}),
		closer: one(users, {
			fields: [studentReferrals.closedBy],
			references: [users.id],
			relationName: 'closer',
		}),
		sessions: many(referralSessions),
	})
);

export const referralSessionsRelations = relations(
	referralSessions,
	({ one }) => ({
		referral: one(studentReferrals, {
			fields: [referralSessions.referralId],
			references: [studentReferrals.id],
		}),
		conductor: one(users, {
			fields: [referralSessions.conductedBy],
			references: [users.id],
		}),
	})
);
