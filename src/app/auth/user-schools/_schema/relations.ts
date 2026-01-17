import { schools } from '@academic/schools/_schema/schools';
import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { userSchools } from './userSchools';

export const userSchoolsRelations = relations(userSchools, ({ one }) => ({
	user: one(users, {
		fields: [userSchools.userId],
		references: [users.id],
	}),
	school: one(schools, {
		fields: [userSchools.schoolId],
		references: [schools.id],
	}),
}));
