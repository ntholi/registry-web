import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { auditLogs } from './auditLogs';

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	changedByUser: one(users, {
		fields: [auditLogs.changedBy],
		references: [users.id],
	}),
}));
