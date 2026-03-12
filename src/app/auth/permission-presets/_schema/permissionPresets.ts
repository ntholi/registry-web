import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const permissionPresets = pgTable('permission_presets', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull().unique(),
	role: text().notNull(),
	description: text(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});
