import { index, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { guardians } from './guardians';

export const guardianPhones = pgTable(
	'guardian_phones',
	{
		id: serial().primaryKey(),
		guardianId: integer()
			.references(() => guardians.id, { onDelete: 'cascade' })
			.notNull(),
		phoneNumber: text().notNull(),
	},
	(table) => ({
		guardianIdx: index('fk_guardian_phones_guardian').on(table.guardianId),
	})
);
