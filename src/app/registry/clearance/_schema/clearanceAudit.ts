import {
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { registrationRequestStatus, users } from '@/core/database';
import { clearance } from './clearance';

export const clearanceAudit = pgTable(
	'clearance_audit',
	{
		id: serial().primaryKey(),
		clearanceId: integer()
			.references(() => clearance.id, { onDelete: 'cascade' })
			.notNull(),
		previousStatus: registrationRequestStatus(),
		newStatus: registrationRequestStatus().notNull(),
		createdBy: text()
			.references(() => users.id, { onDelete: 'set null' })
			.notNull(),
		date: timestamp().defaultNow().notNull(),
		message: text(),
		modules: jsonb().$type<string[]>().notNull().default([]),
	},
	(table) => ({
		clearanceIdIdx: index('fk_clearance_audit_clearance_id').on(
			table.clearanceId
		),
		createdByIdx: index('fk_clearance_audit_created_by').on(table.createdBy),
	})
);
