import { users } from '@auth/users/_schema/users';
import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { studentStatuses } from './studentStatuses';

export const studentStatusApprovalRole = pgEnum(
	'student_status_approval_role',
	['year_leader', 'program_leader', 'student_services', 'finance']
);

export const studentStatusApprovalStatus = pgEnum(
	'student_status_approval_status',
	['pending', 'approved', 'rejected']
);

export const studentStatusApprovals = pgTable(
	'student_status_approvals',
	{
		id: serial().primaryKey(),
		applicationId: integer()
			.references(() => studentStatuses.id, { onDelete: 'cascade' })
			.notNull(),
		approverRole: studentStatusApprovalRole().notNull(),
		status: studentStatusApprovalStatus().notNull().default('pending'),
		respondedBy: text().references(() => users.id, { onDelete: 'set null' }),
		message: text(),
		respondedAt: timestamp(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		appIdIdx: index('idx_student_status_approvals_app_id').on(
			table.applicationId
		),
		statusIdx: index('idx_student_status_approvals_status').on(table.status),
		roleIdx: index('idx_student_status_approvals_role').on(table.approverRole),
		uniqueAppRole: unique('uq_student_status_approvals_app_role').on(
			table.applicationId,
			table.approverRole
		),
	})
);
