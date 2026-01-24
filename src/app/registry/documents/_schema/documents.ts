import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const documentTypeEnum = pgEnum('document_type', [
	'identity',
	'certificate',
	'transcript',
	'proof_of_payment',
	'passport_photo',
	'recommendation_letter',
	'personal_statement',
	'medical_report',
	'enrollment_letter',
	'academic_record',
	'clearance_form',
	'other',
]);
export type DocumentType = (typeof documentTypeEnum.enumValues)[number];

export const documents = pgTable(
	'documents',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		fileName: text().notNull(),
		fileUrl: text(),
		type: documentTypeEnum(),
		certifiedDate: text(),
		certifiedBy: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		typeIdx: index('idx_documents_type').on(table.type),
	})
);
