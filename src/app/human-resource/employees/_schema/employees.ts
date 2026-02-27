import { users } from '@auth/users/_schema/users';
import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { employeeDepartment, employeeStatus, employeeType } from './types';

export const employees = pgTable(
	'employees',
	{
		empNo: text().primaryKey(),
		name: text().notNull(),
		status: employeeStatus().notNull().default('Active'),
		type: employeeType().notNull(),
		department: employeeDepartment(),
		position: text(),
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
	})
);
