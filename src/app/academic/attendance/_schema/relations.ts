import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { semesterModules } from '@academic/semester-modules/_schema/semesterModules';
import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
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
