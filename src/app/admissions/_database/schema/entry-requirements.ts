import { programs } from '@academic/_database';
import {
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { certificateTypes } from './certificate-types';

export const entryRequirements = pgTable(
	'entry_requirements',
	{
		id: serial().primaryKey(),
		programId: integer()
			.references(() => programs.id, { onDelete: 'cascade' })
			.notNull(),
		certificateTypeId: integer()
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
