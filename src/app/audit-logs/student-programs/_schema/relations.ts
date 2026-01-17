import { relations } from 'drizzle-orm';
import { users } from '@/core/database';
import { studentProgramAuditLogs } from './studentProgramAuditLogs';

export const studentProgramAuditLogsRelations = relations(
	studentProgramAuditLogs,
	({ one }) => ({
		updatedByUser: one(users, {
			fields: [studentProgramAuditLogs.updatedBy],
			references: [users.id],
		}),
	})
);
