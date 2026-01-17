import { students } from '@registry/students/_schema/students';
import { bigint, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const documents = pgTable(
	'documents',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		fileName: text().notNull(),
		type: text(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_documents_std_no').on(table.stdNo),
	})
);
