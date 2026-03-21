import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { studentStatuses } from './studentStatuses';

export const studentStatusAttachments = pgTable(
	'student_status_attachments',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		applicationId: text('application_id')
			.references(() => studentStatuses.id, { onDelete: 'cascade' })
			.notNull(),
		fileName: text().notNull(),
		fileKey: text().notNull(),
		fileSize: integer(),
		mimeType: text(),
		createdAt: timestamp().defaultNow().notNull(),
	},
	(table) => ({
		applicationIdx: index('idx_student_status_attachments_application').on(
			table.applicationId
		),
	})
);
