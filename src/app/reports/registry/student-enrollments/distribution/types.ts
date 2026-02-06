export type DistributionType =
	| 'gender'
	| 'country'
	| 'sponsor'
	| 'program-level'
	| 'semester'
	| 'age-group'
	| 'semester-status';

export interface DistributionReportFilter {
	termIds?: number[];
	schoolIds?: number[];
	programId?: number;
	semesterNumber?: string;
}

export interface DistributionDataPoint {
	name: string;
	value: number;
	color?: string;
}

export interface DistributionBreakdown {
	category: string;
	data: DistributionDataPoint[];
	total: number;
}

export interface DistributionResult {
	type: DistributionType;
	label: string;
	total: number;
	overview: DistributionDataPoint[];
	bySchool: DistributionBreakdown[];
	byProgram: DistributionBreakdown[];
	bySemester: DistributionBreakdown[];
	bySemesterStatus: DistributionBreakdown[];
}

export const DISTRIBUTION_OPTIONS: {
	value: DistributionType;
	label: string;
}[] = [
	{ value: 'gender', label: 'Gender' },
	{ value: 'country', label: 'Country/Nationality' },
	{ value: 'sponsor', label: 'Sponsor' },
	{ value: 'program-level', label: 'Program Level' },
	{ value: 'semester', label: 'Semester' },
	{ value: 'age-group', label: 'Age Group' },
	{ value: 'semester-status', label: 'Semester Status' },
];

export const DISTRIBUTION_COLORS: Record<string, string> = {
	Male: 'blue.6',
	Female: 'pink.6',
	Unknown: 'gray.6',
	Active: 'green.6',
	Repeat: 'yellow.6',
	Deferred: 'blue.6',
	DroppedOut: 'red.6',
	Completed: 'teal.6',
	Outstanding: 'orange.6',
	certificate: 'teal.6',
	diploma: 'blue.6',
	degree: 'violet.6',
};

export const AGE_GROUPS = [
	{ min: 0, max: 17, label: 'Under 18' },
	{ min: 18, max: 20, label: '18-20' },
	{ min: 21, max: 24, label: '21-24' },
	{ min: 25, max: 29, label: '25-29' },
	{ min: 30, max: 34, label: '30-34' },
	{ min: 35, max: 39, label: '35-39' },
	{ min: 40, max: 100, label: '40+' },
];
