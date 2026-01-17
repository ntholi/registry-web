import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
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
