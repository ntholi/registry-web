import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { documents } from './documents';

export const documentStamps = pgTable(
	'document_stamps',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		documentId: text()
			.references(() => documents.id, { onDelete: 'cascade' })
			.notNull(),
		date: text(),
		name: text(),
		title: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		documentIdx: index('idx_document_stamps_document').on(table.documentId),
		dateIdx: index('idx_document_stamps_date').on(table.date),
	})
);

export type DocumentStamp = typeof documentStamps.$inferSelect;
export type NewDocumentStamp = typeof documentStamps.$inferInsert;
