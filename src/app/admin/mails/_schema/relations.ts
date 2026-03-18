import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { mailAccountAssignments } from './mailAccountAssignments';
import { mailAccounts } from './mailAccounts';
import { mailQueue } from './mailQueue';
import { mailSentLog } from './mailSentLog';

export const mailAccountsRelations = relations(
	mailAccounts,
	({ many, one }) => ({
		user: one(users, {
			fields: [mailAccounts.userId],
			references: [users.id],
		}),
		assignments: many(mailAccountAssignments),
		queueItems: many(mailQueue),
		sentLogs: many(mailSentLog),
	})
);

export const mailAccountAssignmentsRelations = relations(
	mailAccountAssignments,
	({ one }) => ({
		mailAccount: one(mailAccounts, {
			fields: [mailAccountAssignments.mailAccountId],
			references: [mailAccounts.id],
		}),
		user: one(users, {
			fields: [mailAccountAssignments.userId],
			references: [users.id],
		}),
	})
);

export const mailQueueRelations = relations(mailQueue, ({ one }) => ({
	mailAccount: one(mailAccounts, {
		fields: [mailQueue.mailAccountId],
		references: [mailAccounts.id],
	}),
}));

export const mailSentLogRelations = relations(mailSentLog, ({ one }) => ({
	mailAccount: one(mailAccounts, {
		fields: [mailSentLog.mailAccountId],
		references: [mailAccounts.id],
	}),
	queueItem: one(mailQueue, {
		fields: [mailSentLog.queueId],
		references: [mailQueue.id],
	}),
	sentByUser: one(users, {
		fields: [mailSentLog.sentByUserId],
		references: [users.id],
	}),
}));
