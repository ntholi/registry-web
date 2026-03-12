import { users } from '@auth/users/_schema/users';
import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const lmsCredentials = pgTable('lms_credentials', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull()
		.unique(),
	lmsUserId: integer('lms_user_id'),
	lmsToken: text('lms_token'),
});
