export interface ObservationReportFilter {
	termId?: number;
	cycleId?: string;
	schoolIds?: number[];
	programId?: number;
	lecturerId?: string;
}

export interface ObservationOverviewStats {
	totalObservations: number;
	avgScore: number;
	lecturersEvaluated: number;
	acknowledgmentRate: number;
}

export interface ObservationCategoryAverage {
	categoryId: string;
	categoryName: string;
	section: string;
	avgRating: number;
	ratingCount: number;
	sortOrder: number;
}

export interface ObservationLecturerRanking {
	userId: string;
	lecturerName: string;
	schoolCode: string;
	schoolName: string;
	observationCount: number;
	avgScore: number;
	categoryAverages: Record<string, number>;
}

export interface ObservationTrendPoint {
	termId: number;
	termCode: string;
	avgScore: number;
	observationCount: number;
}

export interface ObservationCriterionBreakdown {
	criterionId: string;
	criterionText: string;
	categoryId: string;
	categoryName: string;
	section: string;
	avgRating: number;
	ratingCount: number;
}

export interface ObservationReportData {
	overview: ObservationOverviewStats;
	categoryAverages: ObservationCategoryAverage[];
	lecturerRankings: ObservationLecturerRanking[];
	trendData: ObservationTrendPoint[];
}

export interface CycleOption {
	id: string;
	name: string;
}
