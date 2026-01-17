import { programs } from '@academic/schools/_schema/programs';
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const structures = pgTable(
	'structures',
	{
		id: serial().primaryKey(),
		cmsId: integer().unique(),
		code: text().notNull().unique(),
		desc: text(),
		programId: integer()
			.references(() => programs.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		programIdIdx: index('fk_structures_program_id').on(table.programId),
	})
);
