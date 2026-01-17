import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { applicants, certificateTypes } from '@/core/database';

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
		id: serial().primaryKey(),
		applicantId: text()
			.references(() => applicants.id, { onDelete: 'cascade' })
			.notNull(),
		certificateTypeId: integer()
			.references(() => certificateTypes.id, { onDelete: 'restrict' })
			.notNull(),
		examYear: integer().notNull(),
		institutionName: text().notNull(),
		qualificationName: text(),
		resultClassification: resultClassificationEnum(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicantIdx: index('fk_academic_records_applicant').on(table.applicantId),
		certTypeIdx: index('fk_academic_records_cert_type').on(
			table.certificateTypeId
		),
	})
);
