import { users } from '@auth/users/_schema/users';
import {
	index,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const clearanceRequestStatus = pgEnum('clearance_request_status', [
	'pending',
	'approved',
	'rejected',
]);

export const clearance = pgTable(
	'clearance',
	{
		id: serial().primaryKey(),
		department: text().notNull(),
		status: clearanceRequestStatus().notNull().default('pending'),
		message: text(),
		respondedBy: text().references(() => users.id, { onDelete: 'cascade' }),
		responseDate: timestamp(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		departmentIdx: index('idx_clearance_department').on(table.department),
		statusIdx: index('idx_clearance_status').on(table.status),
	})
);
