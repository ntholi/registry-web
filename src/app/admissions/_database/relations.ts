import { programs } from '@academic/_database';
import { users } from '@auth/_database';
import { paymentReceipts } from '@finance/_database';
import { relations } from 'drizzle-orm';
import { academicRecords, subjectGrades } from './schema/academic-records';
import {
	applicantPhones,
	applicants,
	guardianPhones,
	guardians,
} from './schema/applicants';
import {
	applicationNotes,
	applicationReceipts,
	applicationStatusHistory,
	applications,
} from './schema/applications';
import { certificateTypes, gradeMappings } from './schema/certificate-types';
import { applicantDocuments } from './schema/documents';
import { entryRequirements } from './schema/entry-requirements';
import { intakePeriods } from './schema/intake-periods';
import { subjects } from './schema/subjects';

export const intakePeriodsRelations = relations(intakePeriods, ({ many }) => ({
	applications: many(applications),
}));

export const certificateTypesRelations = relations(
	certificateTypes,
	({ many }) => ({
		gradeMappings: many(gradeMappings),
		academicRecords: many(academicRecords),
		entryRequirements: many(entryRequirements),
	})
);

export const gradeMappingsRelations = relations(gradeMappings, ({ one }) => ({
	certificateType: one(certificateTypes, {
		fields: [gradeMappings.certificateTypeId],
		references: [certificateTypes.id],
	}),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
	subjectGrades: many(subjectGrades),
}));

export const entryRequirementsRelations = relations(
	entryRequirements,
	({ one }) => ({
		program: one(programs, {
			fields: [entryRequirements.programId],
			references: [programs.id],
		}),
		certificateType: one(certificateTypes, {
			fields: [entryRequirements.certificateTypeId],
			references: [certificateTypes.id],
		}),
	})
);

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

export const academicRecordsRelations = relations(
	academicRecords,
	({ one, many }) => ({
		applicant: one(applicants, {
			fields: [academicRecords.applicantId],
			references: [applicants.id],
		}),
		certificateType: one(certificateTypes, {
			fields: [academicRecords.certificateTypeId],
			references: [certificateTypes.id],
		}),
		subjectGrades: many(subjectGrades),
	})
);

export const subjectGradesRelations = relations(subjectGrades, ({ one }) => ({
	academicRecord: one(academicRecords, {
		fields: [subjectGrades.academicRecordId],
		references: [academicRecords.id],
	}),
	subject: one(subjects, {
		fields: [subjectGrades.subjectId],
		references: [subjects.id],
	}),
}));

export const applicantDocumentsRelations = relations(
	applicantDocuments,
	({ one }) => ({
		applicant: one(applicants, {
			fields: [applicantDocuments.applicantId],
			references: [applicants.id],
		}),
	})
);

export const applicationsRelations = relations(
	applications,
	({ one, many }) => ({
		applicant: one(applicants, {
			fields: [applications.applicantId],
			references: [applicants.id],
		}),
		intakePeriod: one(intakePeriods, {
			fields: [applications.intakePeriodId],
			references: [intakePeriods.id],
		}),
		firstChoiceProgram: one(programs, {
			fields: [applications.firstChoiceProgramId],
			references: [programs.id],
			relationName: 'firstChoiceProgram',
		}),
		secondChoiceProgram: one(programs, {
			fields: [applications.secondChoiceProgramId],
			references: [programs.id],
			relationName: 'secondChoiceProgram',
		}),
		createdByUser: one(users, {
			fields: [applications.createdBy],
			references: [users.id],
		}),
		receipts: many(applicationReceipts),
		statusHistory: many(applicationStatusHistory),
		notes: many(applicationNotes),
	})
);

export const applicationReceiptsRelations = relations(
	applicationReceipts,
	({ one }) => ({
		application: one(applications, {
			fields: [applicationReceipts.applicationId],
			references: [applications.id],
		}),
		receipt: one(paymentReceipts, {
			fields: [applicationReceipts.receiptId],
			references: [paymentReceipts.id],
		}),
	})
);

export const applicationStatusHistoryRelations = relations(
	applicationStatusHistory,
	({ one }) => ({
		application: one(applications, {
			fields: [applicationStatusHistory.applicationId],
			references: [applications.id],
		}),
		changedByUser: one(users, {
			fields: [applicationStatusHistory.changedBy],
			references: [users.id],
		}),
	})
);

export const applicationNotesRelations = relations(
	applicationNotes,
	({ one }) => ({
		application: one(applications, {
			fields: [applicationNotes.applicationId],
			references: [applications.id],
		}),
		createdByUser: one(users, {
			fields: [applicationNotes.createdBy],
			references: [users.id],
		}),
	})
);
