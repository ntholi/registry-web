import { schools } from '@academic/schools/_schema/schools';
import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { employeeSchools } from './employeeSchools';
import { employees } from './employees';

export const employeesRelations = relations(employees, ({ one, many }) => ({
	user: one(users, {
		fields: [employees.userId],
		references: [users.id],
	}),
	employeeSchools: many(employeeSchools),
}));

export const employeeSchoolsRelations = relations(
	employeeSchools,
	({ one }) => ({
		employee: one(employees, {
			fields: [employeeSchools.empNo],
			references: [employees.empNo],
		}),
		school: one(schools, {
			fields: [employeeSchools.schoolId],
			references: [schools.id],
		}),
	})
);
