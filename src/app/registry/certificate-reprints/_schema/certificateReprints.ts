import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import {
	bigint,
	index,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const certificateReprintStatus = pgEnum('certificate_reprint_status', [
	'pending',
	'printed',
]);

export const certificateReprints = pgTable(
	'certificate_reprints',
	{
		id: serial().primaryKey(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		receiptNumber: text(),
		reason: text().notNull(),
		status: certificateReprintStatus().notNull().default('pending'),
		receivedAt: timestamp({ mode: 'date' }),
		createdBy: text()
			.references(() => users.id, { onDelete: 'set null' })
			.notNull(),
		createdAt: timestamp().defaultNow().notNull(),
		updatedAt: timestamp(),
	},
	(table) => ({
		stdNoIdx: index('fk_certificate_reprints_std_no').on(table.stdNo),
		createdByIdx: index('fk_certificate_reprints_created_by').on(
			table.createdBy
		),
	})
);
