import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { users } from '@/core/database';
import { applicationStatusEnum, applications } from './applications';

export const applicationStatusHistory = pgTable(
	'application_status_history',
	{
		id: serial().primaryKey(),
		applicationId: integer()
			.references(() => applications.id, { onDelete: 'cascade' })
			.notNull(),
		fromStatus: applicationStatusEnum(),
		toStatus: applicationStatusEnum().notNull(),
		changedBy: text().references(() => users.id, { onDelete: 'set null' }),
		notes: text(),
		rejectionReason: text(),
		changedAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicationIdx: index('fk_app_status_history_app').on(table.applicationId),
		changedByIdx: index('fk_app_status_history_user').on(table.changedBy),
	})
);
