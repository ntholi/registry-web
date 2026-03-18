export interface ReportFilter {
	termId?: number;
	cycleId?: string;
	schoolIds?: number[];
	programId?: number;
	lecturerId?: string;
}

export interface SchoolComparisonItem {
	schoolId: number;
	schoolCode: string;
	schoolName: string;
	feedbackAvg: number;
	observationAvg: number;
}

export interface TrendPoint {
	termId: number;
	termCode: string;
	feedbackAvg: number;
	observationAvg: number;
}

export interface HeatmapCell {
	schoolId: number;
	schoolCode: string;
	categoryId: string;
	categoryName: string;
	avgRating: number;
}

export interface OverviewLecturerRanking {
	userId: string;
	lecturerName: string;
	schoolCode: string;
	feedbackAvg: number;
	observationAvg: number;
	combinedAvg: number;
}

export interface OverviewData {
	combinedAvg: number;
	feedbackAvg: number;
	observationAvg: number;
	lecturersEvaluated: number;
	schoolComparison: SchoolComparisonItem[];
	trendData: TrendPoint[];
	feedbackHeatmap: HeatmapCell[];
	observationHeatmap: HeatmapCell[];
	lecturerRankings: OverviewLecturerRanking[];
}

export interface FeedbackOverviewStats {
	totalResponses: number;
	avgRating: number;
	responseRate: number;
	lecturersEvaluated: number;
}

export interface CategoryAverage {
	categoryId: string;
	categoryName: string;
	avgRating: number;
	responseCount: number;
	sortOrder: number;
}

export interface FeedbackTrendPoint {
	termId: number;
	termCode: string;
	avgRating: number;
	responseCount: number;
}

export interface FeedbackLecturerRanking {
	userId: string;
	lecturerName: string;
	schoolCode: string;
	schoolName: string;
	moduleCount: number;
	responseCount: number;
	avgRating: number;
	categoryAverages: Record<string, number>;
}

export interface FeedbackReportData {
	overview: FeedbackOverviewStats;
	categoryAverages: CategoryAverage[];
	trendData: FeedbackTrendPoint[];
	lecturerRankings: FeedbackLecturerRanking[];
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

export interface ObservationTrendPoint {
	termId: number;
	termCode: string;
	avgScore: number;
	observationCount: number;
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

export interface CriterionBreakdownItem {
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
	trendData: ObservationTrendPoint[];
	lecturerRankings: ObservationLecturerRanking[];
	criteriaBreakdown: CriterionBreakdownItem[];
}

export interface RatingDistribution {
	rating: number;
	count: number;
	percentage: number;
}

export interface LecturerModuleBreakdown {
	moduleCode: string;
	moduleName: string;
	avgRating: number;
	responseCount: number;
	className: string;
}

export interface LecturerQuestionDetail {
	questionId: string;
	questionText: string;
	categoryName: string;
	avgRating: number;
	overallAvgRating: number;
	responseCount: number;
	distribution: RatingDistribution[];
}

export interface LecturerComment {
	moduleCode: string;
	moduleName: string;
	className: string;
	comment: string;
}

export interface RadarDataPoint {
	category: string;
	feedbackScore: number;
	observationScore: number;
}

export interface FeedbackLecturerDetail {
	userId: string;
	lecturerName: string;
	schoolCode: string;
	avgRating: number;
	modules: LecturerModuleBreakdown[];
	questions: LecturerQuestionDetail[];
	comments: LecturerComment[];
	radarData: RadarDataPoint[];
}

export interface ObservationDetail {
	observationId: string;
	moduleName: string;
	moduleCode: string;
	cycleName: string;
	avgScore: number;
	status: string;
	strengths: string | null;
	improvements: string | null;
	recommendations: string | null;
	trainingArea: string | null;
}

export interface CriteriaScore {
	criterionId: string;
	criterionText: string;
	categoryName: string;
	section: string;
	avgRating: number;
}

export interface ObservationLecturerDetail {
	userId: string;
	lecturerName: string;
	schoolCode: string;
	avgScore: number;
	observations: ObservationDetail[];
	criteriaScores: CriteriaScore[];
	radarData: RadarDataPoint[];
	feedbackCrossRef: {
		modules: LecturerModuleBreakdown[];
		questions: LecturerQuestionDetail[];
		comments: LecturerComment[];
	};
}

export interface CycleOption {
	id: string;
	name: string;
}

export interface AccessInfo {
	hasFullAccess: boolean;
	hasFeedbackAccess: boolean;
	hasObservationAccess: boolean;
}
