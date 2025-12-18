import { relations } from 'drizzle-orm';
import { schools } from '@/modules/academic/database';
import { users } from '@/modules/auth/database';
import { students } from '@/modules/registry/database';
import { fortinetRegistrations } from './schema/fortinet';
import {
	notificationDismissals,
	notificationRecipients,
	notifications,
} from './schema/notifications';
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

export const notificationsRelations = relations(
	notifications,
	({ one, many }) => ({
		creator: one(users, {
			fields: [notifications.createdBy],
			references: [users.id],
		}),
		recipients: many(notificationRecipients),
		dismissals: many(notificationDismissals),
	})
);

export const notificationRecipientsRelations = relations(
	notificationRecipients,
	({ one }) => ({
		notification: one(notifications, {
			fields: [notificationRecipients.notificationId],
			references: [notifications.id],
		}),
		user: one(users, {
			fields: [notificationRecipients.userId],
			references: [users.id],
		}),
	})
);

export const notificationDismissalsRelations = relations(
	notificationDismissals,
	({ one }) => ({
		notification: one(notifications, {
			fields: [notificationDismissals.notificationId],
			references: [notifications.id],
		}),
		user: one(users, {
			fields: [notificationDismissals.userId],
			references: [users.id],
		}),
	})
);
