import { accounts } from '@auth/auth-providers/_schema/accounts';
import { sessions } from '@auth/auth-providers/_schema/sessions';
import { permissionPresets } from '@auth/permission-presets/_schema/permissionPresets';
import { userSchools } from '@auth/user-schools/_schema/userSchools';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const usersRelations = relations(users, ({ many, one }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	preset: one(permissionPresets, {
		fields: [users.presetId],
		references: [permissionPresets.id],
	}),
	userSchools: many(userSchools),
}));
