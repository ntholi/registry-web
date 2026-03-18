import { users } from '@auth/users/_schema/users';
import { sql } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const mailAccounts = pgTable(
	'mail_accounts',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		email: text().notNull().unique(),
		displayName: text(),
		accessToken: text(),
		refreshToken: text(),
		tokenExpiresAt: timestamp({ mode: 'date' }),
		scope: text(),
		isPrimary: boolean().notNull().default(false),
		signature: text(),
		isActive: boolean().notNull().default(true),
		lastSyncAt: timestamp({ mode: 'date' }),
		createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp({ mode: 'date' })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => ({
		userIdIdx: index('mail_accounts_user_id_idx').on(table.userId),
		isPrimaryIdx: index('mail_accounts_is_primary_idx')
			.on(table.isPrimary)
			.where(sql`is_primary = true`),
	})
);
