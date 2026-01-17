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

export const transcriptPrints = pgTable(
	'transcript_prints',
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
		cgpa: real(),
		printedAt: timestamp().defaultNow().notNull(),
	},
	(table) => ({
		stdNoIdx: index('fk_transcript_prints_std_no').on(table.stdNo),
		printedByIdx: index('fk_transcript_prints_printed_by').on(table.printedBy),
	})
);
