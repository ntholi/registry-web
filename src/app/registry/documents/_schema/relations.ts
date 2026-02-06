import { applicantDocuments } from '@admissions/documents/_schema/applicantDocuments';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { documents } from './documents';
import { studentDocuments } from './studentDocuments';

export const documentsRelations = relations(documents, ({ one }) => ({
	studentDocument: one(studentDocuments),
	applicantDocument: one(applicantDocuments),
}));

export const studentDocumentsRelations = relations(
	studentDocuments,
	({ one }) => ({
		document: one(documents, {
			fields: [studentDocuments.documentId],
			references: [documents.id],
		}),
		student: one(students, {
			fields: [studentDocuments.stdNo],
			references: [students.stdNo],
		}),
	})
);
