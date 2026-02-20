export interface FeedbackReportFilter {
	termId?: number;
	cycleId?: string;
	schoolIds?: number[];
	programId?: number;
	moduleId?: number;
}

export interface OverviewStats {
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

export interface RatingDistribution {
	rating: number;
	count: number;
	percentage: number;
}

export interface LecturerRanking {
	userId: string;
	lecturerName: string;
	schoolCode: string;
	schoolName: string;
	moduleCount: number;
	responseCount: number;
	avgRating: number;
	categoryAverages: Record<string, number>;
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

export interface LecturerDetail {
	userId: string;
	lecturerName: string;
	schoolCode: string;
	avgRating: number;
	modules: LecturerModuleBreakdown[];
	questions: LecturerQuestionDetail[];
	comments: LecturerComment[];
}

export interface QuestionBreakdownItem {
	questionId: string;
	questionText: string;
	categoryId: string;
	categoryName: string;
	categorySortOrder: number;
	questionSortOrder: number;
	avgRating: number;
	responseCount: number;
	distribution: RatingDistribution[];
}

export interface FeedbackReportData {
	overview: OverviewStats;
	categoryAverages: CategoryAverage[];
	ratingDistribution: RatingDistribution[];
	lecturerRankings: LecturerRanking[];
	questionBreakdown: QuestionBreakdownItem[];
}

export interface CycleOption {
	id: string;
	name: string;
}

export interface ModuleOption {
	id: number;
	code: string;
	name: string;
}
