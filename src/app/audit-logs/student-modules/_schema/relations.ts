import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { studentModuleAuditLogs } from './studentModuleAuditLogs';

export const studentModuleAuditLogsRelations = relations(
	studentModuleAuditLogs,
	({ one }) => ({
		updatedByUser: one(users, {
			fields: [studentModuleAuditLogs.updatedBy],
			references: [users.id],
		}),
	})
);
