import type { ProgramLevel } from '@academic/_database';

export interface GraduationReportFilter {
	graduationDateId?: number;
	graduationMonth?: string;
	schoolIds?: number[];
	programId?: number;
	programLevels?: ProgramLevel[];
	searchQuery?: string;
	gender?: string;
	sponsorId?: number;
	ageRangeMin?: number;
	ageRangeMax?: number;
	country?: string;
	visibleColumns?: string[];
}

export interface GraduationStudent {
	stdNo: number;
	name: string;
	programName: string;
	programCode: string;
	schoolName: string;
	schoolCode: string;
	graduationDate: string;
	gender: string | null;
	sponsorName: string | null;
	programLevel: string | null;
	country: string | null;
	age: number | null;
	timeToGraduate: number | null;
	email: string | null;
	phone: string | null;
	birthDate: string | null;
	birthPlace: string | null;
	nationalId: string | null;
	address: string | null;
	intake: string | null;
}

export interface GraduationProgramData {
	programName: string;
	programCode: string;
	schoolName: string;
	schoolCode: string;
	schoolId: number;
	totalGraduates: number;
	maleCount: number;
	femaleCount: number;
	averageAge: number | null;
	averageTimeToGraduate: number | null;
}

export interface GraduationSchoolData {
	schoolName: string;
	schoolCode: string;
	totalGraduates: number;
	maleCount: number;
	femaleCount: number;
	averageAge: number | null;
	averageTimeToGraduate: number | null;
	programs: GraduationProgramData[];
}

export interface GraduationSummaryReport {
	graduationDate: string;
	totalGraduates: number;
	maleCount: number;
	femaleCount: number;
	averageAge: number | null;
	averageTimeToGraduate: number | null;
	schools: GraduationSchoolData[];
	generatedAt: Date;
}

export interface GraduationFullReport {
	graduationDate: string;
	totalGraduates: number;
	students: GraduationStudent[];
	generatedAt: Date;
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
	graduatesByProgramLevel: Array<{ level: string; count: number }>;
	graduatesByCountry: Array<{ country: string; count: number }>;
	graduatesByAge: Array<{ age: number; count: number }>;
	graduatesByYear: Array<{ year: string; count: number }>;
}
