import { structures } from '@academic/structures/_schema/structures';
import {
	bigint,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { students } from './students';
import { programStatus } from './types';

export const studentPrograms = pgTable(
	'student_programs',
	{
		id: serial().primaryKey(),
		cmsId: integer().unique(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		intakeDate: text(),
		regDate: text(),
		startTerm: text(),
		structureId: integer()
			.references(() => structures.id, { onDelete: 'cascade' })
			.notNull(),
		stream: text(),
		graduationDate: text(),
		status: programStatus().notNull(),
		assistProvider: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_student_programs_std_no').on(table.stdNo),
		statusIdx: index('idx_student_programs_status').on(table.status),
		structureIdIdx: index('fk_student_programs_structure_id').on(
			table.structureId
		),
		stdNoStatusIdx: index('idx_student_programs_std_no_status').on(
			table.stdNo,
			table.status
		),
	})
);
