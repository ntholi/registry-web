import { dashboardUsers } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import {
	bigint,
	index,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const blockedStudentStatusEnum = pgEnum('blocked_student_status', [
	'blocked',
	'unblocked',
]);

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
