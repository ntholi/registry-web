import { users } from '@auth/_database';
import { studentModules } from '@registry/_database';
import {
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { operationType } from './student-semesters';

type StudentModule = typeof studentModules.$inferSelect;

export const studentModuleAuditLogs = pgTable(
	'student_module_audit_logs',
	{
		id: serial().primaryKey(),
		studentModuleId: integer()
			.references(() => studentModules.id, { onDelete: 'cascade' })
			.notNull(),
		oldValues: jsonb().$type<StudentModule>().notNull(),
		newValues: jsonb().$type<StudentModule>().notNull(),
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
		studentModuleIdIdx: index(
			'fk_student_module_audit_logs_student_module_id'
		).on(table.studentModuleId),
		updatedByIdx: index('fk_student_module_audit_logs_updated_by').on(
			table.updatedBy
		),
		syncedAtIdx: index('idx_student_module_audit_logs_synced_at').on(
			table.syncedAt
		),
	})
);
