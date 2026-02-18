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
import { feedbackPeriods } from './feedbackPeriods';

export const feedbackPassphrases = pgTable(
	'feedback_passphrases',
	{
		id: serial().primaryKey(),
		periodId: integer()
			.references(() => feedbackPeriods.id, { onDelete: 'cascade' })
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
		periodClassIdx: index('idx_feedback_passphrases_period_class').on(
			table.periodId,
			table.structureSemesterId
		),
	})
);
