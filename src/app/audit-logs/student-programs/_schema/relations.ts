import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
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
