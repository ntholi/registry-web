import {
	doublePrecision,
	index,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { applicants } from './applicants';

export const applicantLocations = pgTable(
	'applicant_locations',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		applicantId: text()
			.references(() => applicants.id, { onDelete: 'cascade' })
			.notNull()
			.unique(),
		latitude: doublePrecision(),
		longitude: doublePrecision(),
		country: text(),
		city: text(),
		district: text(),
		ipAddress: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicantIdx: index('fk_applicant_locations_applicant').on(
			table.applicantId
		),
	})
);
