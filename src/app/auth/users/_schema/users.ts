import { permissionPresets } from '@auth/permission-presets/_schema/permissionPresets';
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import type { UserRole } from '@/core/auth/permissions';

export const users = pgTable(
	'users',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		name: text().notNull(),
		role: text().$type<UserRole>().notNull().default('user'),
		email: text().notNull().unique(),
		emailVerified: boolean().notNull().default(false),
		image: text(),
		presetId: text('preset_id').references(() => permissionPresets.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		banned: boolean().default(false),
		banReason: text('ban_reason'),
		banExpires: timestamp('ban_expires'),
	},
	(table) => ({
		presetIdIdx: index('users_preset_id_idx').on(table.presetId),
	})
);
