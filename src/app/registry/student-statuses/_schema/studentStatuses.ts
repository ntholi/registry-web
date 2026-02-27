import { users } from '@auth/users/_schema/users';
import { studentSemesters } from '@registry/students/_schema/studentSemesters';
import { students } from '@registry/students/_schema/students';
import {
	bigint,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const studentStatusType = pgEnum('student_status_type', [
	'withdrawal',
	'deferment',
	'reinstatement',
]);

export const studentStatusStatus = pgEnum('student_status_status', [
	'pending',
	'approved',
	'rejected',
	'cancelled',
]);

export const studentStatusJustification = pgEnum(
	'student_status_justification',
	[
		'medical',
		'transfer',
		'financial',
		'employment',
		'after_withdrawal',
		'after_deferment',
		'failed_modules',
		'upgrading',
		'other',
	]
);

export const studentStatuses = pgTable(
	'student_statuses',
	{
		id: serial().primaryKey(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		type: studentStatusType().notNull(),
		status: studentStatusStatus().notNull().default('pending'),
		justification: studentStatusJustification().notNull(),
		notes: text(),
		termCode: text().notNull(),
		semesterId: integer().references(() => studentSemesters.id, {
			onDelete: 'set null',
		}),
		createdBy: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		stdNoIdx: index('idx_student_statuses_std_no').on(table.stdNo),
		statusIdx: index('idx_student_statuses_status').on(table.status),
		typeIdx: index('idx_student_statuses_type').on(table.type),
		termIdx: index('idx_student_statuses_term').on(table.termCode),
	})
);
