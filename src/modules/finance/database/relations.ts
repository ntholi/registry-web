import { relations } from 'drizzle-orm';
import { terms } from '@/modules/academic/database';
import { registrationRequests, students } from '@/modules/registry/database';
import {
	sponsoredStudents,
	sponsoredTerms,
	sponsors,
} from './schema/sponsorship';

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
