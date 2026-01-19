import { index, pgTable, text } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { guardians } from './guardians';

export const guardianPhones = pgTable(
	'guardian_phones',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		guardianId: text()
			.references(() => guardians.id, { onDelete: 'cascade' })
			.notNull(),
		phoneNumber: text().notNull(),
	},
	(table) => ({
		guardianIdx: index('fk_guardian_phones_guardian').on(table.guardianId),
	})
);
