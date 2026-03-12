import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { accounts } from './accounts';
import { sessions } from './sessions';
import { verifications } from './verifications';

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const verificationsRelations = relations(verifications, () => ({}));
