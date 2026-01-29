import { documents } from '@registry/documents/_schema/documents';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { academicRecords } from './academicRecords';

export const academicDocuments = pgTable(
	'academic_documents',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		academicRecordId: text()
			.references(() => academicRecords.id, { onDelete: 'cascade' })
			.notNull(),
		documentId: text()
			.references(() => documents.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		recordIdx: index('idx_academic_documents_record').on(
			table.academicRecordId
		),
		documentIdx: index('idx_academic_documents_document').on(table.documentId),
	})
);
