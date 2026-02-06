import { structureSemesters } from '@academic/structures/_schema/structureSemesters';
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { studentPrograms } from './studentPrograms';
import { semesterStatus } from './types';

export const studentSemesters = pgTable(
	'student_semesters',
	{
		id: serial().primaryKey(),
		cmsId: integer().unique(),
		termCode: text().notNull(),
		structureSemesterId: integer()
			.references(() => structureSemesters.id, { onDelete: 'cascade' })
			.notNull(),
		status: semesterStatus().notNull(),
		studentProgramId: integer()
			.references(() => studentPrograms.id, { onDelete: 'cascade' })
			.notNull(),
		sponsorId: integer(),
		cafDate: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		studentProgramIdIdx: index('fk_student_semesters_student_program_id').on(
			table.studentProgramId
		),
		structureSemesterIdIdx: index(
			'fk_student_semesters_structure_semester_id'
		).on(table.structureSemesterId),
		termIdx: index('idx_student_semesters_term').on(table.termCode),
		statusIdx: index('idx_student_semesters_status').on(table.status),
		sponsorIdIdx: index('fk_student_semesters_sponsor_id').on(table.sponsorId),
	})
);
