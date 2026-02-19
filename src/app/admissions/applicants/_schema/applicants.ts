import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import {
	bigint,
	boolean,
	date,
	index,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const applicants = pgTable(
	'applicants',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		userId: text()
			.references(() => users.id, { onDelete: 'set null' })
			.unique(),
		stdNo: bigint({ mode: 'number' }).references(() => students.stdNo, {
			onDelete: 'set null',
		}),
		fullName: text().notNull(),
		dateOfBirth: date({ mode: 'string' }),
		nationalId: text().unique(),
		nationality: text(),
		isMosotho: boolean(),
		birthPlace: text(),
		religion: text(),
		address: text(),
		gender: text(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp().defaultNow(),
	},
	(table) => ({
		userIdx: index('fk_applicants_user').on(table.userId),
		stdNoIdx: index('fk_applicants_std_no').on(table.stdNo),
	})
);
