import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const subjects = pgTable('subjects', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull().unique(),
	isActive: boolean().notNull().default(true),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp().defaultNow(),
});
