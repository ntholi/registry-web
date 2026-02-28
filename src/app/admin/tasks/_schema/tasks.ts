import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import {
	bigint,
	date,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const taskPriority = pgEnum('task_priority', [
	'low',
	'medium',
	'high',
	'urgent',
]);

export const taskStatus = pgEnum('task_status', [
	'todo',
	'in_progress',
	'on_hold',
	'completed',
	'cancelled',
]);

export const tasks = pgTable('tasks', {
	id: serial().primaryKey(),
	title: text().notNull(),
	description: text(),
	priority: taskPriority().notNull().default('medium'),
	status: taskStatus().notNull().default('todo'),
	dueDate: date({ mode: 'date' }),
	completedAt: timestamp({ mode: 'date' }),
	createdBy: text()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp({ mode: 'date' }).defaultNow(),
	updatedAt: timestamp({ mode: 'date' }).defaultNow(),
});

export const taskAssignees = pgTable('task_assignees', {
	id: serial().primaryKey(),
	taskId: integer()
		.notNull()
		.references(() => tasks.id, { onDelete: 'cascade' }),
	userId: text()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	assignedAt: timestamp({ mode: 'date' }).defaultNow(),
});

export const taskStudents = pgTable(
	'task_students',
	{
		id: serial().primaryKey(),
		taskId: integer()
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' }),
		stdNo: bigint({ mode: 'number' })
			.notNull()
			.references(() => students.stdNo, { onDelete: 'cascade' }),
		addedAt: timestamp({ mode: 'date' }).defaultNow(),
	},
	(table) => ({
		taskIdIdx: index('idx_task_students_task_id').on(table.taskId),
		stdNoIdx: index('idx_task_students_std_no').on(table.stdNo),
	})
);
