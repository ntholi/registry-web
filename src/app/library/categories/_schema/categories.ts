import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const categories = pgTable('categories', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull().unique(),
	description: text(),
	createdAt: timestamp().defaultNow(),
});
