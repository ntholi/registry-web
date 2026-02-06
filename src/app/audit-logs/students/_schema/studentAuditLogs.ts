import { operationType } from '@audit-logs/student-semesters/_schema/studentSemesterAuditLogs';
import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import {
	bigint,
	index,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

type Student = typeof students.$inferSelect;

export const studentAuditLogs = pgTable(
	'student_audit_logs',
	{
		id: serial().primaryKey(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		oldValues: jsonb().$type<Student>().notNull(),
		newValues: jsonb().$type<Student>().notNull(),
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
		stdNoIdx: index('fk_student_audit_logs_std_no').on(table.stdNo),
		updatedByIdx: index('fk_student_audit_logs_updated_by').on(table.updatedBy),
		syncedAtIdx: index('idx_student_audit_logs_synced_at').on(table.syncedAt),
	})
);
