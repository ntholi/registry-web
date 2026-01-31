import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const recognizedSchools = pgTable('recognized_schools', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	isActive: boolean().notNull().default(true),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
