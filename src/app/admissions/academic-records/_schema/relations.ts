import { applicants } from '@admissions/applicants/_schema/applicants';
import { certificateTypes } from '@admissions/certificate-types/_schema/certificateTypes';
import { subjects } from '@admissions/subjects/_schema/subjects';
import { documents } from '@registry/documents/_schema/documents';
import { relations } from 'drizzle-orm';
import { academicDocuments } from './academicDocuments';
import { academicRecords } from './academicRecords';
import { subjectGrades } from './subjectGrades';

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
		academicDocuments: many(academicDocuments),
	})
);

export const academicDocumentsRelations = relations(
	academicDocuments,
	({ one }) => ({
		academicRecord: one(academicRecords, {
			fields: [academicDocuments.academicRecordId],
			references: [academicRecords.id],
		}),
		document: one(documents, {
			fields: [academicDocuments.documentId],
			references: [documents.id],
		}),
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
