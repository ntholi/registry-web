import { structureSemesters } from '@academic/structures/_schema/structureSemesters';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { feedbackResponses } from '../../_schema/feedbackResponses';
import { feedbackPassphrases } from './feedbackPassphrases';
import { feedbackPeriods } from './feedbackPeriods';

export const feedbackPeriodsRelations = relations(
	feedbackPeriods,
	({ one, many }) => ({
		term: one(terms, {
			fields: [feedbackPeriods.termId],
			references: [terms.id],
		}),
		passphrases: many(feedbackPassphrases),
	})
);

export const feedbackPassphrasesRelations = relations(
	feedbackPassphrases,
	({ one, many }) => ({
		period: one(feedbackPeriods, {
			fields: [feedbackPassphrases.periodId],
			references: [feedbackPeriods.id],
		}),
		structureSemester: one(structureSemesters, {
			fields: [feedbackPassphrases.structureSemesterId],
			references: [structureSemesters.id],
		}),
		responses: many(feedbackResponses),
	})
);
