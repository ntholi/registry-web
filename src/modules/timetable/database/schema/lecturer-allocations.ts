import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { semesterModules, terms } from '@/modules/academic/database';
import { users } from '@/modules/auth/database';

export const lecturerAllocations = pgTable(
	'lecturer_allocations',
	{
		id: serial().primaryKey(),
		minutes: integer().notNull().default(30),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		semesterModuleId: integer()
			.notNull()
			.references(() => semesterModules.id, { onDelete: 'cascade' }),
		termId: integer()
			.notNull()
			.references(() => terms.id, { onDelete: 'cascade' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		userIdIdx: index('fk_lecturer_allocations_user_id').on(table.userId),
		semesterModuleIdIdx: index('fk_lecturer_allocations_semester_module_id').on(
			table.semesterModuleId
		),
		termIdIdx: index('fk_lecturer_allocations_term_id').on(table.termId),
	})
);
