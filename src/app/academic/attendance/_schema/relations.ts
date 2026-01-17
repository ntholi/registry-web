import { relations } from 'drizzle-orm';
import {
	assignedModules,
	semesterModules,
	students,
	terms,
	users,
} from '@/core/database';
import { attendance } from './attendance';

export const attendanceRelations = relations(attendance, ({ one }) => ({
	student: one(students, {
		fields: [attendance.stdNo],
		references: [students.stdNo],
	}),
	term: one(terms, {
		fields: [attendance.termId],
		references: [terms.id],
	}),
	semesterModule: one(semesterModules, {
		fields: [attendance.semesterModuleId],
		references: [semesterModules.id],
	}),
	markedByUser: one(users, {
		fields: [attendance.markedBy],
		references: [users.id],
	}),
	assignedModule: one(assignedModules, {
		fields: [attendance.assignedModuleId],
		references: [assignedModules.id],
	}),
}));
