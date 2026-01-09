import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { applicants } from './applicants';
import { documentCategoryEnum, documentVerificationStatusEnum } from './enums';

export const applicantDocuments = pgTable(
	'applicant_documents',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		applicantId: text()
			.references(() => applicants.id, { onDelete: 'cascade' })
			.notNull(),
		fileName: text().notNull(),
		fileUrl: text().notNull(),
		category: documentCategoryEnum().notNull(),
		verificationStatus: documentVerificationStatusEnum()
			.notNull()
			.default('pending'),
		rejectionReason: text(),
		uploadDate: timestamp().defaultNow(),
	},
	(table) => ({
		applicantIdx: index('fk_applicant_documents_applicant').on(
			table.applicantId
		),
		categoryIdx: index('idx_applicant_documents_category').on(table.category),
		statusIdx: index('idx_applicant_documents_status').on(
			table.verificationStatus
		),
	})
);
