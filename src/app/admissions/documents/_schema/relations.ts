import { relations } from 'drizzle-orm';
import { applicants } from '@/core/database';
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
