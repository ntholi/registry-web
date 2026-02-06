import { standardGradeEnum } from '@admissions/academic-records/_schema/subjectGrades';
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const gradingTypeEnum = pgEnum('grading_type', [
	'subject-grades',
	'classification',
]);
export type GradingType = (typeof gradingTypeEnum.enumValues)[number];

export const certificateTypes = pgTable('certificate_types', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull().unique(),
	description: text(),
	lqfLevel: integer().notNull(),
	gradingType: gradingTypeEnum().notNull().default('subject-grades'),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp().defaultNow(),
});

export const gradeMappings = pgTable(
	'grade_mappings',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		certificateTypeId: text()
			.references(() => certificateTypes.id, { onDelete: 'cascade' })
			.notNull(),
		originalGrade: text().notNull(),
		standardGrade: standardGradeEnum().notNull(),
	},
	(table) => ({
		certGradeUnique: unique('uq_grade_mappings_cert_grade').on(
			table.certificateTypeId,
			table.originalGrade
		),
		certTypeIdx: index('fk_grade_mappings_cert_type').on(
			table.certificateTypeId
		),
	})
);
