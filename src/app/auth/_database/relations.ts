import { schools } from '@academic/_database';
import { relations } from 'drizzle-orm';
import { accounts, authenticators, sessions } from './schema/auth-providers';
import { userSchools } from './schema/user-schools';
import { users } from './schema/users';

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	authenticators: many(authenticators),
	userSchools: many(userSchools),
}));

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

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
	user: one(users, {
		fields: [authenticators.userId],
		references: [users.id],
	}),
}));

export const userSchoolsRelations = relations(userSchools, ({ one }) => ({
	user: one(users, {
		fields: [userSchools.userId],
		references: [users.id],
	}),
	school: one(schools, {
		fields: [userSchools.schoolId],
		references: [schools.id],
	}),
}));
