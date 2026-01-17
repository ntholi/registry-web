import { applicants } from '@admissions/applicants/_schema/applicants';
import { relations } from 'drizzle-orm';
import { applicantDocuments } from './applicantDocuments';

export const applicantDocumentsRelations = relations(
	applicantDocuments,
	({ one }) => ({
		applicant: one(applicants, {
			fields: [applicantDocuments.applicantId],
			references: [applicants.id],
		}),
	})
);
