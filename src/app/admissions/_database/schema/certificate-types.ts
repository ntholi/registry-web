import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { standardGradeEnum } from './enums';

export const certificateTypes = pgTable('certificate_types', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	description: text(),
	lqfLevel: integer().notNull(),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp().defaultNow(),
});

export const gradeMappings = pgTable(
	'grade_mappings',
	{
		id: serial().primaryKey(),
		certificateTypeId: integer()
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
