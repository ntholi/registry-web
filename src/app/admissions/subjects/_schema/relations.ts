import { subjectGrades } from '@admissions/academic-records/_schema/subjectGrades';
import { relations } from 'drizzle-orm';
import { subjectAliases } from './subjectAliases';
import { subjects } from './subjects';

export const subjectsRelations = relations(subjects, ({ many }) => ({
	subjectGrades: many(subjectGrades),
	aliases: many(subjectAliases),
}));

export const subjectAliasesRelations = relations(subjectAliases, ({ one }) => ({
	subject: one(subjects, {
		fields: [subjectAliases.subjectId],
		references: [subjects.id],
	}),
}));
