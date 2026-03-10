import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { studentStatuses } from './studentStatuses';

export const studentStatusAttachments = pgTable(
	'student_status_attachments',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		statusId: text()
			.references(() => studentStatuses.id, { onDelete: 'cascade' })
			.notNull(),
		fileName: text().notNull(),
		fileKey: text().notNull(),
		fileSize: integer(),
		mimeType: text(),
		createdAt: timestamp().defaultNow().notNull(),
	},
	(table) => ({
		statusIdx: index('idx_student_status_attachments_status').on(
			table.statusId
		),
	})
);
