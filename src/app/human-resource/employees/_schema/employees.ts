import { schools } from '@academic/schools/_schema/schools';
import { users } from '@auth/users/_schema/users';
import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { employeeStatus, employeeType } from './types';

export const employees = pgTable(
	'employees',
	{
		empNo: text().primaryKey(),
		name: text().notNull(),
		status: employeeStatus().notNull().default('Active'),
		type: employeeType().notNull(),
		schoolId: integer().references(() => schools.id, { onDelete: 'set null' }),
		userId: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		nameTrigramIdx: index('idx_employees_name_trgm').using(
			'gin',
			sql`${table.name} gin_trgm_ops`
		),
		userIdIdx: index('fk_employees_user_id').on(table.userId),
		schoolIdIdx: index('fk_employees_school_id').on(table.schoolId),
	})
);
