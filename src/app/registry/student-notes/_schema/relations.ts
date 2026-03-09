import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { studentNoteAttachments } from './studentNoteAttachments';
import { studentNotes } from './studentNotes';

export const studentNotesRelations = relations(
	studentNotes,
	({ one, many }) => ({
		student: one(students, {
			fields: [studentNotes.stdNo],
			references: [students.stdNo],
		}),
		createdByUser: one(users, {
			fields: [studentNotes.createdBy],
			references: [users.id],
		}),
		attachments: many(studentNoteAttachments),
	})
);

export const studentNoteAttachmentsRelations = relations(
	studentNoteAttachments,
	({ one }) => ({
		note: one(studentNotes, {
			fields: [studentNoteAttachments.noteId],
			references: [studentNotes.id],
		}),
	})
);
