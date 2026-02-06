import { academicRecords } from '@admissions/academic-records/_schema/academicRecords';
import { applications } from '@admissions/applications/_schema/applications';
import { applicantDocuments } from '@admissions/documents/_schema/applicantDocuments';
import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { applicantPhones } from './applicantPhones';
import { applicants } from './applicants';
import { guardianPhones } from './guardianPhones';
import { guardians } from './guardians';

export const applicantsRelations = relations(applicants, ({ one, many }) => ({
	user: one(users, {
		fields: [applicants.userId],
		references: [users.id],
	}),
	student: one(students, {
		fields: [applicants.stdNo],
		references: [students.stdNo],
	}),
	phones: many(applicantPhones),
	guardians: many(guardians),
	academicRecords: many(academicRecords),
	documents: many(applicantDocuments),
	applications: many(applications),
}));

export const applicantPhonesRelations = relations(
	applicantPhones,
	({ one }) => ({
		applicant: one(applicants, {
			fields: [applicantPhones.applicantId],
			references: [applicants.id],
		}),
	})
);

export const guardiansRelations = relations(guardians, ({ one, many }) => ({
	applicant: one(applicants, {
		fields: [guardians.applicantId],
		references: [applicants.id],
	}),
	phones: many(guardianPhones),
}));

export const guardianPhonesRelations = relations(guardianPhones, ({ one }) => ({
	guardian: one(guardians, {
		fields: [guardianPhones.guardianId],
		references: [guardians.id],
	}),
}));
