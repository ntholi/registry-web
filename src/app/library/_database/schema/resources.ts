import { users } from '@auth/_database';
import { sql } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { resourceType } from './enums';

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
