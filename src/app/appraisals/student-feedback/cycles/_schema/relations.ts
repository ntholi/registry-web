import { schools } from '@academic/schools/_schema/schools';
import { structureSemesters } from '@academic/structures/_schema/structureSemesters';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { studentFeedbackResponses } from '../../_schema/studentFeedbackResponses';
import { studentFeedbackCycleSchools } from './studentFeedbackCycleSchools';
import { studentFeedbackCycles } from './studentFeedbackCycles';
import { studentFeedbackPassphrases } from './studentFeedbackPassphrases';

export const studentFeedbackCyclesRelations = relations(
	studentFeedbackCycles,
	({ one, many }) => ({
		term: one(terms, {
			fields: [studentFeedbackCycles.termId],
			references: [terms.id],
		}),
		passphrases: many(studentFeedbackPassphrases),
		cycleSchools: many(studentFeedbackCycleSchools),
	})
);

export const studentFeedbackCycleSchoolsRelations = relations(
	studentFeedbackCycleSchools,
	({ one }) => ({
		cycle: one(studentFeedbackCycles, {
			fields: [studentFeedbackCycleSchools.cycleId],
			references: [studentFeedbackCycles.id],
		}),
		school: one(schools, {
			fields: [studentFeedbackCycleSchools.schoolId],
			references: [schools.id],
		}),
	})
);

export const studentFeedbackPassphrasesRelations = relations(
	studentFeedbackPassphrases,
	({ one, many }) => ({
		cycle: one(studentFeedbackCycles, {
			fields: [studentFeedbackPassphrases.cycleId],
			references: [studentFeedbackCycles.id],
		}),
		structureSemester: one(structureSemesters, {
			fields: [studentFeedbackPassphrases.structureSemesterId],
			references: [structureSemesters.id],
		}),
		responses: many(studentFeedbackResponses),
	})
);
