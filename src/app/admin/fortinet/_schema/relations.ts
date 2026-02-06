import { schools } from '@academic/schools/_schema/schools';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
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
