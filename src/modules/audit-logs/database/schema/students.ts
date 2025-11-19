import {
	bigint,
	index,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { users } from '@/modules/auth/database';
import { students } from '@/modules/registry/database';
import { operationType } from './student-semesters';

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
