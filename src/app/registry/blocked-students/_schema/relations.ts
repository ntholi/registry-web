import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { blockedStudents } from './blockedStudents';

export const blockedStudentsRelations = relations(
	blockedStudents,
	({ one }) => ({
		student: one(students, {
			fields: [blockedStudents.stdNo],
			references: [students.stdNo],
		}),
	})
);
