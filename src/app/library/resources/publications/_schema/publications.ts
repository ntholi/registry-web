import { documents } from '@registry/documents/_schema/documents';
import { sql } from 'drizzle-orm';
import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const publicationType = pgEnum('publication_type', [
	'ResearchPaper',
	'Thesis',
	'Journal',
	'Other',
]);
export type PublicationType = (typeof publicationType.enumValues)[number];

export const publications = pgTable(
	'publications',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		documentId: text()
			.references(() => documents.id, { onDelete: 'cascade' })
			.notNull(),
		title: text().notNull(),
		abstract: text(),
		datePublished: text(),
		type: publicationType().notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		titleTrigramIdx: index('idx_publications_title_trgm').using(
			'gin',
			sql`${table.title} gin_trgm_ops`
		),
		typeIdx: index('idx_publications_type').on(table.type),
		documentIdx: index('fk_publications_document').on(table.documentId),
	})
);
