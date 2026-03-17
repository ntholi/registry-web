import { schools } from '@academic/schools/_schema/schools';
import { structureSemesters } from '@academic/structures/_schema/structureSemesters';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { studentFeedbackResponses } from '../../student-feedback/_schema/studentFeedbackResponses';
import { feedbackCycleSchools } from './feedbackCycleSchools';
import { feedbackCycles } from './feedbackCycles';
import { studentFeedbackPassphrases } from './studentFeedbackPassphrases';

export const feedbackCyclesRelations = relations(
	feedbackCycles,
	({ one, many }) => ({
		term: one(terms, {
			fields: [feedbackCycles.termId],
			references: [terms.id],
		}),
		passphrases: many(studentFeedbackPassphrases),
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

export const studentFeedbackPassphrasesRelations = relations(
	studentFeedbackPassphrases,
	({ one, many }) => ({
		cycle: one(feedbackCycles, {
			fields: [studentFeedbackPassphrases.cycleId],
			references: [feedbackCycles.id],
		}),
		structureSemester: one(structureSemesters, {
			fields: [studentFeedbackPassphrases.structureSemesterId],
			references: [structureSemesters.id],
		}),
		responses: many(studentFeedbackResponses),
	})
);
