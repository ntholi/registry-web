import type {
	academicRecords,
	ResultClassification,
	subjectGrades,
} from '@/core/database';
import type { ApplicantDocument } from '../../documents/_lib/types';

export type AcademicRecord = typeof academicRecords.$inferSelect;
export type AcademicRecordInsert = typeof academicRecords.$inferInsert;

export type SubjectGrade = typeof subjectGrades.$inferSelect;
export type SubjectGradeInsert = typeof subjectGrades.$inferInsert;

export type SubjectGradeInput = {
	subjectId: string;
	originalGrade: string;
};

export type AcademicRecordWithRelations = AcademicRecord & {
	certificateType: { id: string; name: string; lqfLevel: number };
	subjectGrades: (SubjectGrade & {
		subject: { id: string; name: string };
	})[];
	applicantDocument?: ApplicantDocument | null;
};

export type CreateAcademicRecordInput = {
	certificateTypeId: string;
	examYear: number;
	institutionName: string;
	qualificationName?: string | null;
	certificateNumber?: string | null;
	resultClassification?: ResultClassification | null;
	subjectGrades?: SubjectGradeInput[];
};
