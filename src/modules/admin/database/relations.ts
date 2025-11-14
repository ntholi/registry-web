import { relations } from 'drizzle-orm';
import { schools } from '@/modules/academic/database';
import { users } from '@/modules/auth/database';
import { students } from '@/modules/registry/database';
import { fortinetRegistrations } from './schema/fortinet';
import { taskAssignments, tasks } from './schema/tasks';

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

export const tasksRelations = relations(tasks, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [tasks.createdBy],
		references: [users.id],
	}),
	taskAssignments: many(taskAssignments),
}));

export const taskAssignmentsRelations = relations(
	taskAssignments,
	({ one }) => ({
		task: one(tasks, {
			fields: [taskAssignments.taskId],
			references: [tasks.id],
		}),
		user: one(users, {
			fields: [taskAssignments.userId],
			references: [users.id],
		}),
	})
);
