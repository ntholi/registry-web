import { users } from '@auth/users/_schema/users';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import type { DashboardRole } from '@/core/auth/permissions';

export const letterTemplates = pgTable('letter_templates', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull(),
	subject: text(),
	salutation: text().notNull().default('Dear Sir/Madam,'),
	content: text().notNull(),
	signOffName: text('sign_off_name'),
	signOffTitle: text('sign_off_title'),
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
