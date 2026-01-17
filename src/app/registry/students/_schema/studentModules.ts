import {
	index,
	integer,
	pgEnum,
	pgTable,
	real,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { semesterModules } from '@/core/database';
import { studentSemesters } from './studentSemesters';
import { studentModuleStatus } from './types';

export const grade = pgEnum('grade', [
	'A+',
	'A',
	'A-',
	'B+',
	'B',
	'B-',
	'C+',
	'C',
	'C-',
	'F',
	'PC',
	'PX',
	'AP',
	'X',
	'DEF',
	'GNS',
	'ANN',
	'FIN',
	'FX',
	'DNC',
	'DNA',
	'PP',
	'DNS',
	'EXP',
	'NM',
]);
export type Grade = (typeof grade.enumValues)[number];

export const studentModules = pgTable(
	'student_modules',
	{
		id: serial().primaryKey(),
		cmsId: integer().unique(),
		semesterModuleId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		status: studentModuleStatus().notNull(),
		marks: text().notNull(),
		grade: grade().notNull(),
		credits: real().notNull(),
		studentSemesterId: integer()
			.references(() => studentSemesters.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		studentSemesterIdIdx: index('fk_student_modules_student_semester_id').on(
			table.studentSemesterId
		),
		semesterModuleIdIdx: index('fk_student_modules_semester_module_id').on(
			table.semesterModuleId
		),
		statusIdx: index('idx_student_modules_status').on(table.status),
	})
);
