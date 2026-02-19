import { schools } from '@academic/schools/_schema/schools';
import { structureSemesters } from '@academic/structures/_schema/structureSemesters';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { feedbackResponses } from '../../_schema/feedbackResponses';
import { feedbackCycleSchools } from './feedbackCycleSchools';
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
		cycleSchools: many(feedbackCycleSchools),
	})
);

export const feedbackCycleSchoolsRelations = relations(
	feedbackCycleSchools,
	({ one }) => ({
		cycle: one(feedbackCycles, {
			fields: [feedbackCycleSchools.cycleId],
			references: [feedbackCycles.id],
		}),
		school: one(schools, {
			fields: [feedbackCycleSchools.schoolId],
			references: [schools.id],
		}),
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
