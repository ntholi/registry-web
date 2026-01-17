import {
	bigint,
	index,
	integer,
	pgTable,
	real,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { students, users } from '@/core/database';

export const statementOfResultsPrints = pgTable(
	'statement_of_results_prints',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		printedBy: text()
			.references(() => users.id, { onDelete: 'set null' })
			.notNull(),
		studentName: text().notNull(),
		programName: text().notNull(),
		totalCredits: integer().notNull(),
		totalModules: integer().notNull(),
		cgpa: real(),
		classification: text(),
		academicStatus: text(),
		graduationDate: text(),
		printedAt: timestamp().defaultNow().notNull(),
	},
	(table) => ({
		stdNoIdx: index('fk_statement_of_results_prints_std_no').on(table.stdNo),
		printedByIdx: index('fk_statement_of_results_prints_printed_by').on(
			table.printedBy
		),
	})
);
