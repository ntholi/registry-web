import { relations } from 'drizzle-orm';
import { users } from '@/core/database';
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
