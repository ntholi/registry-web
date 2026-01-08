import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { applicants } from './applicants';
import { certificateTypes } from './certificate-types';
import { resultClassificationEnum, standardGradeEnum } from './enums';
import { subjects } from './subjects';

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

export const subjectGrades = pgTable(
	'subject_grades',
	{
		id: serial().primaryKey(),
		academicRecordId: integer()
			.references(() => academicRecords.id, { onDelete: 'cascade' })
			.notNull(),
		subjectId: integer()
			.references(() => subjects.id, { onDelete: 'restrict' })
			.notNull(),
		originalGrade: text().notNull(),
		standardGrade: standardGradeEnum().notNull(),
	},
	(table) => ({
		recordSubjectUnique: unique('uq_subject_grades_record_subject').on(
			table.academicRecordId,
			table.subjectId
		),
		recordIdx: index('fk_subject_grades_record').on(table.academicRecordId),
		subjectIdx: index('fk_subject_grades_subject').on(table.subjectId),
	})
);
