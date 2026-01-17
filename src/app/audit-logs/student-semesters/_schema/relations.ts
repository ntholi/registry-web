import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { studentSemesterAuditLogs } from './studentSemesterAuditLogs';

export const studentSemesterAuditLogsRelations = relations(
	studentSemesterAuditLogs,
	({ one }) => ({
		updatedByUser: one(users, {
			fields: [studentSemesterAuditLogs.updatedBy],
			references: [users.id],
		}),
	})
);
