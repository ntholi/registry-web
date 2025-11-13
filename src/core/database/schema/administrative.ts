import {
	bigint,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { schools } from './academic-structure';
import { users } from './auth';
import {
	blockedStudentStatusEnum,
	dashboardUsers,
	fortinetLevel,
	fortinetRegistrationStatus,
	taskPriority,
	taskStatus,
} from './enums';
import { students } from './students';

export const userSchools = pgTable(
	'user_schools',
	{
		id: serial().primaryKey(),
		userId: text()
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		schoolId: integer()
			.references(() => schools.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueUserSchool: unique().on(table.userId, table.schoolId),
		userIdIdx: index('fk_user_schools_user_id').on(table.userId),
		schoolIdIdx: index('fk_user_schools_school_id').on(table.schoolId),
	})
);

export const blockedStudents = pgTable(
	'blocked_students',
	{
		id: serial().primaryKey(),
		status: blockedStudentStatusEnum().notNull().default('blocked'),
		reason: text().notNull(),
		byDepartment: dashboardUsers().notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_blocked_students_std_no').on(table.stdNo),
	})
);

export const documents = pgTable(
	'documents',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		fileName: text().notNull(),
		type: text(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_documents_std_no').on(table.stdNo),
	})
);

export const fortinetRegistrations = pgTable(
	'fortinet_registrations',
	{
		id: serial().primaryKey(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		schoolId: integer()
			.references(() => schools.id, { onDelete: 'cascade' })
			.notNull(),
		level: fortinetLevel().notNull(),
		status: fortinetRegistrationStatus().notNull().default('pending'),
		message: text(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		uniqueStudentLevel: unique().on(table.stdNo, table.level),
		stdNoIdx: index('fk_fortinet_registrations_std_no').on(table.stdNo),
		schoolIdIdx: index('fk_fortinet_registrations_school_id').on(
			table.schoolId
		),
		statusIdx: index('idx_fortinet_registrations_status').on(table.status),
	})
);

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
