import { dashboardUsers, users } from '@auth/users/_schema/users';
import { terms } from '@registry/terms/_schema/terms';
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';

export const autoApprovalRules = pgTable(
	'auto_approval_rules',
	{
		id: serial().primaryKey(),
		stdNo: integer().notNull(),
		termId: integer()
			.notNull()
			.references(() => terms.id, { onDelete: 'cascade' }),
		department: dashboardUsers().notNull(),
		createdBy: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueRule: unique('unique_auto_approval_rule').on(
			table.stdNo,
			table.termId,
			table.department
		),
		stdNoIdx: index('idx_auto_approval_std_no').on(table.stdNo),
		termIdIdx: index('idx_auto_approval_term_id').on(table.termId),
		departmentIdx: index('idx_auto_approval_department').on(table.department),
	})
);
