import { relations } from 'drizzle-orm';
import { schools, users } from '@/core/database';
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
