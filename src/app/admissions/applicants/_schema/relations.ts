import { relations } from 'drizzle-orm';
import {
	academicRecords,
	applicantDocuments,
	applications,
} from '@/core/database';
import { applicantPhones } from './applicantPhones';
import { applicants } from './applicants';
import { guardianPhones } from './guardianPhones';
import { guardians } from './guardians';

export const applicantsRelations = relations(applicants, ({ many }) => ({
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
