type DateRange = {
	start: Date;
	end: Date;
};

type TimePreset = 'today' | '7d' | '30d' | 'custom';

type DepartmentSummary = {
	totalOperations: number;
	totalEmployees: number;
	activeEmployees: number;
	operationsByType: {
		inserts: number;
		updates: number;
		deletes: number;
	};
	topTables: Array<{ tableName: string; count: number }>;
};

type EmployeeSummary = {
	userId: string;
	name: string | null;
	email: string | null;
	image: string | null;
	totalOperations: number;
	lastActiveAt: Date | null;
	inserts: number;
	updates: number;
	deletes: number;
};

type EmployeeActivity = {
	user: {
		id: string;
		name: string | null;
		email: string | null;
		image: string | null;
	};
	totalOperations: number;
	operationsByType: { inserts: number; updates: number; deletes: number };
	topTables: Array<{ tableName: string; count: number }>;
	dailyActivity: Array<{ date: string; count: number }>;
};

type HeatmapData = Array<{
	dayOfWeek: number;
	hour: number;
	count: number;
}>;

type DailyTrend = {
	date: string;
	total: number;
	inserts: number;
	updates: number;
	deletes: number;
};

type EntityBreakdown = {
	tableName: string;
	total: number;
	inserts: number;
	updates: number;
	deletes: number;
};

type ClearanceEmployeeStats = {
	userId: string;
	name: string | null;
	email: string | null;
	image: string | null;
	approved: number;
	rejected: number;
	pending: number;
	total: number;
	approvalRate: number;
};

type PrintEmployeeStats = {
	userId: string;
	transcripts: number;
	statements: number;
	studentCards: number;
	totalPrints: number;
};

export type {
	ClearanceEmployeeStats,
	DailyTrend,
	DateRange,
	DepartmentSummary,
	EmployeeActivity,
	EmployeeSummary,
	EntityBreakdown,
	HeatmapData,
	PrintEmployeeStats,
	TimePreset,
};
