import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { studentNotes } from './studentNotes';

export const studentNoteAttachments = pgTable(
	'student_note_attachments',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		noteId: text()
			.references(() => studentNotes.id, { onDelete: 'cascade' })
			.notNull(),
		fileName: text().notNull(),
		fileKey: text().notNull(),
		fileSize: integer(),
		mimeType: text(),
		createdAt: timestamp().defaultNow().notNull(),
	},
	(table) => ({
		noteIdx: index('idx_student_note_attachments_note').on(table.noteId),
	})
);
