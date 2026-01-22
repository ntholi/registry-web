import { users } from '@auth/users/_schema/users';
import { documents } from '@registry/documents/_schema/documents';
import { sql } from 'drizzle-orm';
import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const resourceType = pgEnum('resource_type', [
	'PastPaper',
	'ResearchPaper',
	'Thesis',
	'Journal',
	'Other',
]);
export type ResourceType = (typeof resourceType.enumValues)[number];

export const libraryResources = pgTable(
	'library_resources',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		documentId: text()
			.references(() => documents.id, { onDelete: 'cascade' })
			.notNull(),
		title: text().notNull(),
		description: text(),
		type: resourceType().notNull(),
		uploadedBy: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		titleTrigramIdx: index('idx_library_resources_title_trgm').using(
			'gin',
			sql`${table.title} gin_trgm_ops`
		),
		typeIdx: index('idx_library_resources_type').on(table.type),
		uploadedByIdx: index('idx_library_resources_uploaded_by').on(
			table.uploadedBy
		),
		documentIdx: index('fk_library_resources_document').on(table.documentId),
	})
);
