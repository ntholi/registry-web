import {
	index,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { dashboardUsers, users } from '@/modules/auth/database';
import { taskPriority, taskStatus } from './enums';

export const tasks = pgTable(
	'tasks',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		title: text().notNull(),
		description: text(),
		status: taskStatus().notNull().default('active'),
		priority: taskPriority().notNull().default('medium'),
		department: dashboardUsers().notNull(),
		createdBy: text()
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		scheduledFor: timestamp(),
		dueDate: timestamp(),
		completedAt: timestamp(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		departmentIdx: index('tasks_department_idx').on(table.department),
		statusIdx: index('tasks_status_idx').on(table.status),
		dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
	})
);

export const taskAssignments = pgTable(
	'task_assignments',
	{
		id: serial().primaryKey(),
		taskId: text()
			.references(() => tasks.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text()
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueTaskAssignment: unique().on(table.taskId, table.userId),
		userIdIdx: index('fk_task_assignments_user_id').on(table.userId),
	})
);
