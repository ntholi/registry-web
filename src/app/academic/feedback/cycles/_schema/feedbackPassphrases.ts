import { structureSemesters } from '@academic/structures/_schema/structureSemesters';
import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { feedbackCycles } from './feedbackCycles';

export const feedbackPassphrases = pgTable(
	'feedback_passphrases',
	{
		id: serial().primaryKey(),
		cycleId: integer()
			.references(() => feedbackCycles.id, { onDelete: 'cascade' })
			.notNull(),
		structureSemesterId: integer()
			.references(() => structureSemesters.id)
			.notNull(),
		passphrase: text().notNull().unique(),
		used: boolean().notNull().default(false),
		usedAt: timestamp(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		passphraseIdx: index('idx_feedback_passphrases_passphrase').on(
			table.passphrase
		),
		cycleClassIdx: index('idx_feedback_passphrases_cycle_class').on(
			table.cycleId,
			table.structureSemesterId
		),
	})
);
