import { relations } from 'drizzle-orm';
import {
	accounts,
	authenticators,
	sessions,
	userSchools,
} from '@/core/database';
import { users } from './users';

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	authenticators: many(authenticators),
	userSchools: many(userSchools),
}));
