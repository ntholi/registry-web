import { subjects } from '@admissions/subjects/_schema/subjects';
import { index, pgEnum, pgTable, text, unique } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { academicRecords } from './academicRecords';

export const standardGradeEnum = pgEnum('standard_grade', [
	'A*',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'U',
]);
export type StandardGrade = (typeof standardGradeEnum.enumValues)[number];

export const subjectGrades = pgTable(
	'subject_grades',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		academicRecordId: text()
			.references(() => academicRecords.id, { onDelete: 'cascade' })
			.notNull(),
		subjectId: text()
			.references(() => subjects.id, { onDelete: 'restrict' })
			.notNull(),
		originalGrade: text().notNull(),
		standardGrade: standardGradeEnum(),
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
