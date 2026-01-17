import { accounts } from '@auth/auth-providers/_schema/accounts';
import { authenticators } from '@auth/auth-providers/_schema/authenticators';
import { sessions } from '@auth/auth-providers/_schema/sessions';
import { userSchools } from '@auth/user-schools/_schema/userSchools';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	authenticators: many(authenticators),
	userSchools: many(userSchools),
}));
