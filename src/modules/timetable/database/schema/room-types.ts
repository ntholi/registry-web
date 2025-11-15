import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const roomTypes = pgTable('room_types', {
	id: serial().primaryKey(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp().defaultNow(),
});
