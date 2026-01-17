import { relations } from 'drizzle-orm';
import { schools, students } from '@/core/database';
import { fortinetRegistrations } from './fortinetRegistrations';

export const fortinetRegistrationsRelations = relations(
	fortinetRegistrations,
	({ one }) => ({
		student: one(students, {
			fields: [fortinetRegistrations.stdNo],
			references: [students.stdNo],
		}),
		school: one(schools, {
			fields: [fortinetRegistrations.schoolId],
			references: [schools.id],
		}),
	})
);
