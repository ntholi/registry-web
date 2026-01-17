import { relations } from 'drizzle-orm';
import { users } from '@/core/database';
import { studentAuditLogs } from './studentAuditLogs';

export const studentAuditLogsRelations = relations(
	studentAuditLogs,
	({ one }) => ({
		updatedByUser: one(users, {
			fields: [studentAuditLogs.updatedBy],
			references: [users.id],
		}),
	})
);
