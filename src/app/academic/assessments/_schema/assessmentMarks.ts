import {
	index,
	integer,
	pgTable,
	real,
	serial,
	timestamp,
} from 'drizzle-orm/pg-core';
import { studentModules } from '@/core/database';
import { assessments } from './assessments';

export const assessmentMarks = pgTable(
	'assessment_marks',
	{
		id: serial().primaryKey(),
		assessmentId: integer()
			.references(() => assessments.id, { onDelete: 'cascade' })
			.notNull(),
		studentModuleId: integer()
			.references(() => studentModules.id, { onDelete: 'cascade' })
			.notNull(),
		marks: real().notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		assessmentIdIdx: index('fk_assessment_marks_assessment_id').on(
			table.assessmentId
		),
		studentModuleIdIdx: index('fk_assessment_marks_student_module_id').on(
			table.studentModuleId
		),
		assessmentIdStudentModuleIdIdx: index(
			'idx_assessment_marks_assessment_id_student_module_id'
		).on(table.assessmentId, table.studentModuleId),
	})
);
