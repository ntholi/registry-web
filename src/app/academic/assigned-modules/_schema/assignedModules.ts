import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { semesterModules, terms, users } from '@/core/database';

export const assignedModules = pgTable(
	'assigned_modules',
	{
		id: serial().primaryKey(),
		termId: integer()
			.references(() => terms.id, { onDelete: 'cascade' })
			.notNull(),
		active: boolean().notNull().default(true),
		userId: text()
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		semesterModuleId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		lmsCourseId: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		userIdIdx: index('fk_assigned_modules_user_id').on(table.userId),
		termIdIdx: index('fk_assigned_modules_term_id').on(table.termId),
		semesterModuleIdIdx: index('fk_assigned_modules_semester_module_id').on(
			table.semesterModuleId
		),
		courseIdIdx: index('idx_assigned_modules_course_id').on(table.lmsCourseId),
	})
);
