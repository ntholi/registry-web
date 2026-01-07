import type { ProgramLevel } from '@academic/_database/schema/enums';

export interface GraduationsFilter {
	graduationDate?: string;
	schoolIds?: number[];
	programId?: number;
	programLevels?: ProgramLevel[];
	gender?: string;
	sponsorId?: number;
	ageRangeMin?: number;
	ageRangeMax?: number;
	country?: string;
	visibleColumns?: string[];
	searchQuery?: string;
}

export interface GraduatedStudent {
	stdNo: number;
	name: string;
	programName: string;
	semesterNumber: string;
	schoolName: string;
	schoolCode: string;
	sponsorName: string | null;
	graduationDate: string;
	gender: string | null;
	programLevel: string | null;
	country: string | null;
	age: number | null;
	timeToGraduate: number | null;
}

export interface SummaryProgramData {
	programName: string;
	schoolName: string;
	schoolCode: string;
	totalGraduates: number;
}

export interface SummarySchoolData {
	schoolName: string;
	schoolCode: string;
	totalGraduates: number;
	programs: SummaryProgramData[];
}

export interface GraduationSummaryStats {
	totalGraduates: number;
	byGender: { gender: string; count: number }[];
	byLevel: { level: string; count: number }[];
	averageAge: number | null;
	averageTimeToGraduate: number | null;
}

export interface GraduationChartData {
	graduatesBySchool: Array<{ name: string; count: number; code: string }>;
	graduatesByProgram: Array<{
		name: string;
		code: string;
		count: number;
		school: string;
	}>;
	graduatesByGender: Array<{ gender: string; count: number }>;
	graduatesByLevel: Array<{ level: string; count: number }>;
}
