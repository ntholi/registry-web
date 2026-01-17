import {
	bigint,
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { students } from '@/core/database';
import { sponsors } from './sponsors';

export const sponsoredStudents = pgTable(
	'sponsored_students',
	{
		id: serial().primaryKey(),
		sponsorId: integer()
			.references(() => sponsors.id, { onDelete: 'cascade' })
			.notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		borrowerNo: text(),
		bankName: text(),
		accountNumber: text(),
		confirmed: boolean().default(false),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		uniqueSponsoredStudent: unique().on(table.sponsorId, table.stdNo),
		sponsorIdIdx: index('fk_sponsored_students_sponsor_id').on(table.sponsorId),
		stdNoIdx: index('fk_sponsored_students_std_no').on(table.stdNo),
	})
);
