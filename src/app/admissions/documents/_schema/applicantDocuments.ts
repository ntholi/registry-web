import { applicants } from '@admissions/applicants/_schema/applicants';
import { users } from '@auth/users/_schema/users';
import { documents } from '@registry/documents/_schema/documents';
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const documentVerificationStatusEnum = pgEnum(
	'document_verification_status',
	['pending', 'verified', 'rejected']
);
export type DocumentVerificationStatus =
	(typeof documentVerificationStatusEnum.enumValues)[number];

export const applicantDocuments = pgTable(
	'applicant_documents',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		documentId: text()
			.references(() => documents.id, { onDelete: 'cascade' })
			.notNull(),
		applicantId: text()
			.references(() => applicants.id, { onDelete: 'cascade' })
			.notNull(),
		verificationStatus: documentVerificationStatusEnum()
			.notNull()
			.default('pending'),
		rejectionReason: text(),
		rotation: integer().notNull().default(0),
		reviewLockedBy: text().references(() => users.id, {
			onDelete: 'set null',
		}),
		reviewLockedAt: timestamp({ mode: 'date' }),
	},
	(table) => ({
		documentIdx: index('fk_applicant_documents_document').on(table.documentId),
		applicantIdx: index('fk_applicant_documents_applicant').on(
			table.applicantId
		),
		statusIdx: index('idx_applicant_documents_status').on(
			table.verificationStatus
		),
	})
);
