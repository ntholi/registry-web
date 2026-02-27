import { schools } from '@academic/schools/_schema/schools';
import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { employees } from './employees';

export const employeesRelations = relations(employees, ({ one }) => ({
	user: one(users, {
		fields: [employees.userId],
		references: [users.id],
	}),
	school: one(schools, {
		fields: [employees.schoolId],
		references: [schools.id],
	}),
}));
