import {
	index,
	integer,
	pgTable,
	serial,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { registrationRequests } from '@/core/database';
import { clearance } from './clearance';

export const registrationClearance = pgTable(
	'registration_clearance',
	{
		id: serial().primaryKey(),
		registrationRequestId: integer()
			.references(() => registrationRequests.id, { onDelete: 'cascade' })
			.notNull(),
		clearanceId: integer()
			.references(() => clearance.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueRegistrationClearance: unique().on(
			table.registrationRequestId,
			table.clearanceId
		),
		registrationRequestIdIdx: index(
			'fk_registration_clearance_registration_request_id'
		).on(table.registrationRequestId),
		clearanceIdIdx: index('fk_registration_clearance_clearance_id').on(
			table.clearanceId
		),
	})
);
