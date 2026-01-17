import { users } from '@auth/users/_schema/users';
import { studentSemesters } from '@registry/students/_schema/studentSemesters';
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

type StudentSemester = typeof studentSemesters.$inferSelect;

export const operationType = pgEnum('operation_type', ['create', 'update']);

export const studentSemesterAuditLogs = pgTable(
	'student_semester_audit_logs',
	{
		id: serial().primaryKey(),
		studentSemesterId: integer()
			.references(() => studentSemesters.id, { onDelete: 'cascade' })
			.notNull(),
		studentSemesterCmsId: integer(),
		oldValues: jsonb().$type<StudentSemester>().notNull(),
		newValues: jsonb().$type<StudentSemester>().notNull(),
		operation: operationType().notNull().default('update'),
		reasons: text(),
		updatedBy: text()
			.references(() => users.id, { onDelete: 'set null' })
			.notNull(),
		updatedAt: timestamp().notNull().defaultNow(),
		syncedAt: timestamp(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		studentSemesterIdIdx: index(
			'fk_student_semester_sync_records_student_semester_id'
		).on(table.studentSemesterId),
		updatedByIdx: index('fk_student_semester_sync_records_updated_by').on(
			table.updatedBy
		),
		syncedAtIdx: index('idx_student_semester_sync_records_synced_at').on(
			table.syncedAt
		),
	})
);
