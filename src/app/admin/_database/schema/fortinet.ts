import { schools } from '@academic/_database';
import { students } from '@registry/_database';
import {
	bigint,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { fortinetLevel, fortinetRegistrationStatus } from './enums';

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
