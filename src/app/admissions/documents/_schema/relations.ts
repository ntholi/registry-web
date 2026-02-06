import { applicants } from '@admissions/applicants/_schema/applicants';
import { documents } from '@registry/documents/_schema/documents';
import { relations } from 'drizzle-orm';
import { applicantDocuments } from './applicantDocuments';

export const applicantDocumentsRelations = relations(
	applicantDocuments,
	({ one }) => ({
		document: one(documents, {
			fields: [applicantDocuments.documentId],
			references: [documents.id],
		}),
		applicant: one(applicants, {
			fields: [applicantDocuments.applicantId],
			references: [applicants.id],
		}),
	})
);
