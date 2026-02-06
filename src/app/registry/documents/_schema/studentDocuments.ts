import { students } from '@registry/students/_schema/students';
import { bigint, index, pgTable, text } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { documents } from './documents';

export const studentDocuments = pgTable(
	'student_documents',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		documentId: text()
			.references(() => documents.id, { onDelete: 'cascade' })
			.notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
	},
	(table) => ({
		documentIdx: index('fk_student_documents_document').on(table.documentId),
		stdNoIdx: index('fk_student_documents_std_no').on(table.stdNo),
	})
);
