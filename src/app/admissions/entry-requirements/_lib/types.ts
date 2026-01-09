import type { entryRequirements } from '@/core/database';

export type EntryRequirement = typeof entryRequirements.$inferSelect;
export type EntryRequirementInsert = typeof entryRequirements.$inferInsert;

export type Level4Rules = {
	type: 'level4';
	minimumGrades: { count: number; grade: string };
	requiredSubjects: { subjectId: number; minimumGrade: string }[];
	optionalSubjectGroups?: {
		name: string;
		subjectIds: number[];
		minimumGrade: string;
		required: boolean;
	}[];
	alternatives?: Level4Rules[];
};

export type Level5PlusRules = {
	type: 'level5plus';
	minimumClassification: 'Distinction' | 'Merit' | 'Credit' | 'Pass';
	requiredQualificationName?: string;
};

export type EntryRules = Level4Rules | Level5PlusRules;

export type EntryRequirementWithRelations = EntryRequirement & {
	program: { id: number; code: string; name: string };
	certificateType: { id: number; name: string; lqfLevel: number };
};
