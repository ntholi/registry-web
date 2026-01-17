import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	timestamp,
} from 'drizzle-orm/pg-core';
import { semesterModules, studentModuleStatus } from '@/core/database';
import { registrationRequests } from './registrationRequests';

export const requestedModuleStatus = pgEnum('requested_module_status', [
	'pending',
	'registered',
	'rejected',
]);

export const requestedModules = pgTable(
	'requested_modules',
	{
		id: serial().primaryKey(),
		moduleStatus: studentModuleStatus().notNull().default('Compulsory'),
		registrationRequestId: integer()
			.references(() => registrationRequests.id, { onDelete: 'cascade' })
			.notNull(),
		semesterModuleId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		status: requestedModuleStatus().notNull().default('pending'),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		registrationRequestIdIdx: index(
			'fk_requested_modules_registration_request_id'
		).on(table.registrationRequestId),
		semesterModuleIdIdx: index('fk_requested_modules_semester_module_id').on(
			table.semesterModuleId
		),
	})
);
