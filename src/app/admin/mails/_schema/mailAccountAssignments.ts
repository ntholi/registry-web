import { users } from '@auth/users/_schema/users';
import { sql } from 'drizzle-orm';
import {
	boolean,
	check,
	index,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { mailAccounts } from './mailAccounts';

export const mailAccountAssignments = pgTable(
	'mail_account_assignments',
	{
		id: serial().primaryKey(),
		mailAccountId: text()
			.notNull()
			.references(() => mailAccounts.id, { onDelete: 'cascade' }),
		role: text(),
		userId: text().references(() => users.id, { onDelete: 'cascade' }),
		canCompose: boolean().notNull().default(false),
		canReply: boolean().notNull().default(true),
		createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
	},
	(table) => ({
		accountIdx: index('mail_assignments_account_idx').on(table.mailAccountId),
		roleIdx: index('mail_assignments_role_idx')
			.on(table.role)
			.where(sql`role IS NOT NULL`),
		userIdx: index('mail_assignments_user_idx')
			.on(table.userId)
			.where(sql`user_id IS NOT NULL`),
		accountRoleUnique: uniqueIndex('mail_assignments_account_role_unique')
			.on(table.mailAccountId, table.role)
			.where(sql`role IS NOT NULL`),
		accountUserUnique: uniqueIndex('mail_assignments_account_user_unique')
			.on(table.mailAccountId, table.userId)
			.where(sql`user_id IS NOT NULL`),
		roleOrUserCheck: check(
			'mail_assignments_role_or_user',
			sql`(role IS NOT NULL AND user_id IS NULL) OR (role IS NULL AND user_id IS NOT NULL)`
		),
	})
);
