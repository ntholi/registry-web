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
import { educationLevel, educationType } from './types';

export const studentEducation = pgTable(
	'student_education',
	{
		id: serial().primaryKey(),
		cmsId: integer().unique(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		schoolName: text().notNull(),
		type: educationType(),
		level: educationLevel(),
		startDate: timestamp({ mode: 'date' }),
		endDate: timestamp({ mode: 'date' }),
		createdAt: timestamp().notNull().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_student_education_std_no').on(table.stdNo),
		schoolNameIdx: index('idx_student_education_school_name').on(
			table.schoolName
		),
	})
);
