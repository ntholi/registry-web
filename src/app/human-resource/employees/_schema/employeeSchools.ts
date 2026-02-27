import { schools } from '@academic/schools/_schema/schools';
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { employees } from './employees';

export const employeeSchools = pgTable(
	'employee_schools',
	{
		id: serial().primaryKey(),
		empNo: text()
			.references(() => employees.empNo, { onDelete: 'cascade' })
			.notNull(),
		schoolId: integer()
			.references(() => schools.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueEmployeeSchool: unique().on(table.empNo, table.schoolId),
		empNoIdx: index('fk_employee_schools_emp_no').on(table.empNo),
		schoolIdIdx: index('fk_employee_schools_school_id').on(table.schoolId),
	})
);
