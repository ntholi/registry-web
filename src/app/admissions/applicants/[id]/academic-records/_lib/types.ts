import type {
	academicRecords,
	ResultClassification,
	subjectGrades,
} from '@/core/database';

export type AcademicRecord = typeof academicRecords.$inferSelect;
export type AcademicRecordInsert = typeof academicRecords.$inferInsert;

export type SubjectGrade = typeof subjectGrades.$inferSelect;
export type SubjectGradeInsert = typeof subjectGrades.$inferInsert;

export type SubjectGradeInput = {
	subjectId: number;
	originalGrade: string;
};

export type AcademicRecordWithRelations = AcademicRecord & {
	certificateType: { id: number; name: string; lqfLevel: number };
	subjectGrades: (SubjectGrade & {
		subject: { id: number; name: string };
	})[];
};

export type CreateAcademicRecordInput = {
	certificateTypeId: number;
	examYear: number;
	institutionName: string;
	qualificationName?: string | null;
	certificateNumber?: string | null;
	resultClassification?: ResultClassification | null;
	subjectGrades?: SubjectGradeInput[];
};
