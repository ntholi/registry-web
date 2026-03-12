import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../users/_schema/users';

export const sessions = pgTable(
	'sessions',
	{
		id: text().primaryKey(),
		token: text().notNull().unique(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		impersonatedBy: text('impersonated_by'),
	},
	(table) => ({
		userIdIdx: index('sessions_user_id_idx').on(table.userId),
	})
);
