import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { taskAssignees, taskStudents, tasks } from './tasks';

export const tasksRelations = relations(tasks, ({ many, one }) => ({
	creator: one(users, {
		fields: [tasks.createdBy],
		references: [users.id],
	}),
	assignees: many(taskAssignees),
	students: many(taskStudents),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
	task: one(tasks, {
		fields: [taskAssignees.taskId],
		references: [tasks.id],
	}),
	user: one(users, {
		fields: [taskAssignees.userId],
		references: [users.id],
	}),
}));

export const taskStudentsRelations = relations(taskStudents, ({ one }) => ({
	task: one(tasks, {
		fields: [taskStudents.taskId],
		references: [tasks.id],
	}),
	student: one(students, {
		fields: [taskStudents.stdNo],
		references: [students.stdNo],
	}),
}));
