import { relations } from 'drizzle-orm';
import { users } from '@/core/database';
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
