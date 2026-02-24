import { users } from '@auth/users/_schema/users';
import {
	bigserial,
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const auditLogs = pgTable(
	'audit_logs',
	{
		id: bigserial({ mode: 'bigint' }).primaryKey(),
		tableName: text().notNull(),
		recordId: text().notNull(),
		operation: text().notNull(),
		oldValues: jsonb(),
		newValues: jsonb(),
		changedBy: text().references(() => users.id, { onDelete: 'set null' }),
		changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		syncedAt: timestamp({ withTimezone: true }),
		metadata: jsonb(),
		activityType: text('activity_type'),
	},
	(table) => [
		index('idx_audit_logs_table_record').on(table.tableName, table.recordId),
		index('idx_audit_logs_changed_by').on(table.changedBy),
		index('idx_audit_logs_changed_at').on(table.changedAt),
		index('idx_audit_logs_table_operation').on(
			table.tableName,
			table.operation
		),
		index('idx_audit_logs_synced_at').on(table.syncedAt),
		index('idx_audit_logs_user_date').on(table.changedBy, table.changedAt),
		index('idx_audit_logs_activity_type').on(table.activityType),
		index('idx_audit_logs_user_activity').on(
			table.changedBy,
			table.activityType,
			table.changedAt
		),
	]
);
