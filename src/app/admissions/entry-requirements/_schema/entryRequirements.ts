import { programs } from '@academic/schools/_schema/programs';
import { certificateTypes } from '@admissions/certificate-types/_schema/certificateTypes';
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const entryRequirements = pgTable(
	'entry_requirements',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		programId: integer()
			.references(() => programs.id, { onDelete: 'cascade' })
			.notNull(),
		certificateTypeId: text()
			.references(() => certificateTypes.id, { onDelete: 'restrict' })
			.notNull(),
		rules: jsonb().notNull(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp().defaultNow(),
	},
	(table) => ({
		programCertUnique: unique('uq_entry_requirements_program_cert').on(
			table.programId,
			table.certificateTypeId
		),
		programIdx: index('fk_entry_requirements_program').on(table.programId),
		certTypeIdx: index('fk_entry_requirements_cert_type').on(
			table.certificateTypeId
		),
	})
);
