import {
	index,
	integer,
	pgTable,
	serial,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { clearance } from '../../../clearance/_schema/clearance';
import { graduationRequests } from '../../requests/_schema/graduationRequests';

export const graduationClearance = pgTable(
	'graduation_clearance',
	{
		id: serial().primaryKey(),
		graduationRequestId: integer()
			.references(() => graduationRequests.id, { onDelete: 'cascade' })
			.notNull(),
		clearanceId: integer()
			.references(() => clearance.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueRegistrationClearance: unique().on(table.clearanceId),
		graduationRequestIdIdx: index(
			'fk_graduation_clearance_graduation_request_id'
		).on(table.graduationRequestId),
		clearanceIdIdx: index('fk_graduation_clearance_clearance_id').on(
			table.clearanceId
		),
	})
);
