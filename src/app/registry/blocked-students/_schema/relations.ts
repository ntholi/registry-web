import { relations } from 'drizzle-orm';
import { students } from '@/core/database';
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
