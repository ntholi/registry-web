import {
	bigint,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { students } from './students';
import { nextOfKinRelationship } from './types';

export const nextOfKins = pgTable(
	'next_of_kins',
	{
		id: serial().primaryKey(),
		cmsId: integer().unique(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		name: text().notNull(),
		relationship: nextOfKinRelationship().notNull(),
		phone: text(),
		email: text(),
		occupation: text(),
		address: text(),
		country: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_next_of_kins_std_no').on(table.stdNo),
	})
);
