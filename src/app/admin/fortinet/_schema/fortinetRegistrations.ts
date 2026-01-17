import {
	bigint,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { schools, students } from '@/core/database';

export const fortinetLevel = pgEnum('fortinet_level', [
	'nse1',
	'nse2',
	'nse3',
	'nse4',
	'nse5',
	'nse6',
	'nse7',
	'nse8',
]);

export const fortinetRegistrationStatus = pgEnum(
	'fortinet_registration_status',
	['pending', 'approved', 'rejected', 'completed']
);

export const fortinetRegistrations = pgTable(
	'fortinet_registrations',
	{
		id: serial().primaryKey(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		schoolId: integer()
			.references(() => schools.id, { onDelete: 'cascade' })
			.notNull(),
		level: fortinetLevel().notNull(),
		status: fortinetRegistrationStatus().notNull().default('pending'),
		message: text(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		uniqueStudentLevel: unique().on(table.stdNo, table.level),
		stdNoIdx: index('fk_fortinet_registrations_std_no').on(table.stdNo),
		schoolIdIdx: index('fk_fortinet_registrations_school_id').on(
			table.schoolId
		),
		statusIdx: index('idx_fortinet_registrations_status').on(table.status),
	})
);
