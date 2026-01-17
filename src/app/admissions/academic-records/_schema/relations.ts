import { relations } from 'drizzle-orm';
import { applicants, certificateTypes, subjects } from '@/core/database';
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
