import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { schools, users } from '@/core/database';

export const userSchools = pgTable(
	'user_schools',
	{
		id: serial().primaryKey(),
		userId: text()
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		schoolId: integer()
			.references(() => schools.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueUserSchool: unique().on(table.userId, table.schoolId),
		userIdIdx: index('fk_user_schools_user_id').on(table.userId),
		schoolIdIdx: index('fk_user_schools_school_id').on(table.schoolId),
	})
);
