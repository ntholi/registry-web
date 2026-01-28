import { applicantDocuments } from '@admissions/documents/_schema/applicantDocuments';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { documentStamps } from './documentStamps';
import { documents } from './documents';
import { studentDocuments } from './studentDocuments';

export const documentsRelations = relations(documents, ({ one, many }) => ({
	studentDocument: one(studentDocuments),
	applicantDocument: one(applicantDocuments),
	stamps: many(documentStamps),
}));

export const documentStampsRelations = relations(documentStamps, ({ one }) => ({
	document: one(documents, {
		fields: [documentStamps.documentId],
		references: [documents.id],
	}),
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
