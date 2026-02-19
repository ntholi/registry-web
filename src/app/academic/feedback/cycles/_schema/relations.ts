import { structureSemesters } from '@academic/structures/_schema/structureSemesters';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { feedbackResponses } from '../../_schema/feedbackResponses';
import { feedbackCycles } from './feedbackCycles';
import { feedbackPassphrases } from './feedbackPassphrases';

export const feedbackCyclesRelations = relations(
	feedbackCycles,
	({ one, many }) => ({
		term: one(terms, {
			fields: [feedbackCycles.termId],
			references: [terms.id],
		}),
		passphrases: many(feedbackPassphrases),
	})
);

export const feedbackPassphrasesRelations = relations(
	feedbackPassphrases,
	({ one, many }) => ({
		cycle: one(feedbackCycles, {
			fields: [feedbackPassphrases.cycleId],
			references: [feedbackCycles.id],
		}),
		structureSemester: one(structureSemesters, {
			fields: [feedbackPassphrases.structureSemesterId],
			references: [structureSemesters.id],
		}),
		responses: many(feedbackResponses),
	})
);
