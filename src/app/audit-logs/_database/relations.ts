import { users } from '@auth/_database';
import { relations } from 'drizzle-orm';
import { studentModuleAuditLogs } from './schema/student-modules';
import { studentProgramAuditLogs } from './schema/student-programs';
import { studentSemesterAuditLogs } from './schema/student-semesters';
import { studentAuditLogs } from './schema/students';

export const studentAuditLogsRelations = relations(
	studentAuditLogs,
	({ one }) => ({
		updatedByUser: one(users, {
			fields: [studentAuditLogs.updatedBy],
			references: [users.id],
		}),
	})
);

export const studentModuleAuditLogsRelations = relations(
	studentModuleAuditLogs,
	({ one }) => ({
		updatedByUser: one(users, {
			fields: [studentModuleAuditLogs.updatedBy],
			references: [users.id],
		}),
	})
);

export const studentProgramAuditLogsRelations = relations(
	studentProgramAuditLogs,
	({ one }) => ({
		updatedByUser: one(users, {
			fields: [studentProgramAuditLogs.updatedBy],
			references: [users.id],
		}),
	})
);

export const studentSemesterAuditLogsRelations = relations(
	studentSemesterAuditLogs,
	({ one }) => ({
		updatedByUser: one(users, {
			fields: [studentSemesterAuditLogs.updatedBy],
			references: [users.id],
		}),
	})
);
