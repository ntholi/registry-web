import { applicants } from '@admissions/applicants/_schema/applicants';
import { certificateTypes } from '@admissions/certificate-types/_schema/certificateTypes';
import { applicantDocuments } from '@admissions/documents/_schema/applicantDocuments';
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const resultClassificationEnum = pgEnum('result_classification', [
	'Distinction',
	'Merit',
	'Credit',
	'Pass',
	'Fail',
]);
export type ResultClassification =
	(typeof resultClassificationEnum.enumValues)[number];

export const academicRecords = pgTable(
	'academic_records',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		applicantId: text()
			.references(() => applicants.id, { onDelete: 'cascade' })
			.notNull(),
		certificateTypeId: text()
			.references(() => certificateTypes.id, { onDelete: 'restrict' })
			.notNull(),
		applicantDocumentId: text().references(() => applicantDocuments.id, {
			onDelete: 'set null',
		}),
		examYear: integer().notNull(),
		institutionName: text().notNull(),
		qualificationName: text(),
		certificateNumber: text().unique(),
		candidateNumber: text(),
		resultClassification: resultClassificationEnum(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicantIdx: index('fk_academic_records_applicant').on(table.applicantId),
		certTypeIdx: index('fk_academic_records_cert_type').on(
			table.certificateTypeId
		),
		docIdx: index('fk_academic_records_applicant_document').on(
			table.applicantDocumentId
		),
	})
);
