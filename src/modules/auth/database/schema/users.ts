import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { userPositions, userRoles } from './enums';

export const users = pgTable('users', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text(),
	role: userRoles().notNull().default('user'),
	position: userPositions(),
	email: text().unique(),
	emailVerified: timestamp({ mode: 'date' }),
	image: text(),
});
