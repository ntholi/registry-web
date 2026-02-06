import { registrationRequests } from '@registry/registration-requests/_schema/registrationRequests';
import { students } from '@registry/students/_schema/students';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { sponsoredStudents } from './sponsoredStudents';
import { sponsoredTerms } from './sponsoredTerms';
import { sponsors } from './sponsors';

export const sponsorsRelations = relations(sponsors, ({ many }) => ({
	sponsoredStudents: many(sponsoredStudents),
}));

export const sponsoredStudentsRelations = relations(
	sponsoredStudents,
	({ one, many }) => ({
		sponsor: one(sponsors, {
			fields: [sponsoredStudents.sponsorId],
			references: [sponsors.id],
		}),
		student: one(students, {
			fields: [sponsoredStudents.stdNo],
			references: [students.stdNo],
		}),
		sponsoredTerms: many(sponsoredTerms),
		registrationRequests: many(registrationRequests),
	})
);

export const sponsoredTermsRelations = relations(sponsoredTerms, ({ one }) => ({
	sponsoredStudent: one(sponsoredStudents, {
		fields: [sponsoredTerms.sponsoredStudentId],
		references: [sponsoredStudents.id],
	}),
	term: one(terms, {
		fields: [sponsoredTerms.termId],
		references: [terms.id],
	}),
}));
