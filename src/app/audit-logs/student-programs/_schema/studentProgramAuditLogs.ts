import { operationType } from '@audit-logs/student-semesters/_schema/studentSemesterAuditLogs';
import { users } from '@auth/users/_schema/users';
import { studentPrograms } from '@registry/students/_schema/studentPrograms';
import {
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

type StudentProgram = typeof studentPrograms.$inferSelect;

export const studentProgramAuditLogs = pgTable(
	'student_program_audit_logs',
	{
		id: serial().primaryKey(),
		studentProgramId: integer()
			.references(() => studentPrograms.id, { onDelete: 'cascade' })
			.notNull(),
		studentProgramCmsId: integer(),
		oldValues: jsonb().$type<StudentProgram>().notNull(),
		newValues: jsonb().$type<StudentProgram>().notNull(),
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
		studentProgramIdIdx: index(
			'fk_student_program_audit_logs_student_program_id'
		).on(table.studentProgramId),
		updatedByIdx: index('fk_student_program_audit_logs_updated_by').on(
			table.updatedBy
		),
		syncedAtIdx: index('idx_student_program_audit_logs_synced_at').on(
			table.syncedAt
		),
	})
);
