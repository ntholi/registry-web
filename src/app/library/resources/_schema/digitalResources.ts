import { sql } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { users } from '@/core/database';

export const resourceType = pgEnum('resource_type', [
	'PastPaper',
	'ResearchPaper',
	'Thesis',
	'Journal',
	'Other',
]);
export type ResourceType = (typeof resourceType.enumValues)[number];

export const digitalResources = pgTable(
	'digital_resources',
	{
		id: serial().primaryKey(),
		title: text().notNull(),
		description: text(),
		type: resourceType().notNull(),
		fileName: text().notNull(),
		originalName: text().notNull(),
		fileSize: integer().notNull(),
		mimeType: text().notNull(),
		isDownloadable: boolean().notNull().default(true),
		uploadedBy: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		titleTrigramIdx: index('idx_digital_resources_title_trgm').using(
			'gin',
			sql`${table.title} gin_trgm_ops`
		),
		typeIdx: index('idx_digital_resources_type').on(table.type),
		uploadedByIdx: index('idx_digital_resources_uploaded_by').on(
			table.uploadedBy
		),
	})
);
