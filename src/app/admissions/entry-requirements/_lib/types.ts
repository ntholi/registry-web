import type { ProgramLevel } from '@academic/_database';
import type { entryRequirements } from '@/core/database';

export type EntryRequirement = typeof entryRequirements.$inferSelect;
export type EntryRequirementInsert = typeof entryRequirements.$inferInsert;

export type SubjectGradeRules = {
	type: 'subject-grades';
	minimumGrades: { count: number; grade: string };
	requiredSubjects: { subjectId: number; minimumGrade: string }[];
	optionalSubjectGroups?: {
		name: string;
		subjectIds: number[];
		minimumGrade: string;
		required: boolean;
	}[];
	alternatives?: SubjectGradeRules[];
};

export type ClassificationRules = {
	type: 'classification';
	minimumClassification: 'Distinction' | 'Merit' | 'Credit' | 'Pass';
	requiredQualificationName?: string;
};

export type EntryRules = SubjectGradeRules | ClassificationRules;

export type EntryRequirementWithRelations = EntryRequirement & {
	program: { id: number; code: string; name: string };
	certificateType: { id: number; name: string; lqfLevel: number };
};

export type ProgramWithSchool = {
	id: number;
	code: string;
	name: string;
	level: ProgramLevel;
	schoolId: number;
	school: {
		id: number;
		code: string;
		name: string;
	};
};

export type EntryRequirementFilter = {
	schoolId?: number;
	level?: ProgramLevel;
};
