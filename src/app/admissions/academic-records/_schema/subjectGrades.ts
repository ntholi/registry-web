import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	unique,
} from 'drizzle-orm/pg-core';
import { subjects } from '@/core/database';
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
