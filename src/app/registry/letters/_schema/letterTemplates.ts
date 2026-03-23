import { users } from '@auth/users/_schema/users';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import type { DashboardRole } from '@/core/auth/permissions';

export const letterTemplates = pgTable('letter_templates', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull(),
	content: text().notNull(),
	role: text().$type<DashboardRole>(),
	isActive: boolean().notNull().default(true),
	createdBy: text('created_by').references(() => users.id, {
		onDelete: 'set null',
	}),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
