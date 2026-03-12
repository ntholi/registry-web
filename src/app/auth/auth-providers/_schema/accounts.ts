import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../users/_schema/users';

export const accounts = pgTable(
	'accounts',
	{
		id: text().primaryKey(),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text(),
		idToken: text('id_token'),
		password: text(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(account) => ({
		userIdIdx: index('accounts_user_id_idx').on(account.userId),
	})
);
