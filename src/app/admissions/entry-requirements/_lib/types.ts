import type { ProgramLevel } from '@academic/_database';
import type { entryRequirements } from '@/core/database';

export type EntryRequirement = typeof entryRequirements.$inferSelect;
export type EntryRequirementInsert = typeof entryRequirements.$inferInsert;

export type MinimumGradeRequirement = { count: number; grade: string };

export type SubjectGradeRules = {
	type: 'subject-grades';
	minimumGrades: MinimumGradeRequirement[];
	subjects: { subjectId: string; minimumGrade: string; required: boolean }[];
	subjectGroups?: {
		name: string;
		subjectIds: string[];
		minimumGrade: string;
		required: boolean;
	}[];
};

export type ClassificationRules = {
	type: 'classification';
	minimumClassification?: 'Distinction' | 'Merit' | 'Credit' | 'Pass';
	requiredQualificationName?: string;
};

export type EntryRules = SubjectGradeRules | ClassificationRules;

export type EntryRequirementSummary = {
	id: string;
	rules: EntryRules;
	certificateType: { id: string; name: string; lqfLevel: number } | null;
};

export type EntryRequirementWithRelations = EntryRequirement & {
	program: {
		id: number;
		code: string;
		name: string;
		level: ProgramLevel;
		schoolId: number;
		school: {
			id: number;
			code: string;
			name: string;
			shortName: string | null;
		};
	};
	certificateType: { id: string; name: string; lqfLevel: number };
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
		shortName: string | null;
	};
};

export type ProgramWithRequirements = ProgramWithSchool & {
	entryRequirements: EntryRequirementSummary[];
};

export type SchoolSummary = {
	id: number;
	code: string;
	name: string;
	shortName: string | null;
};

export type EntryRequirementFilter = {
	schoolId?: number;
	level?: ProgramLevel;
};

export type SubjectRef = {
	id: string;
	name: string;
};

export type PublicCoursesData = {
	programs: {
		items: ProgramWithRequirements[];
		totalPages: number;
		totalItems: number;
	};
	schools: SchoolSummary[];
	subjects: SubjectRef[];
};
