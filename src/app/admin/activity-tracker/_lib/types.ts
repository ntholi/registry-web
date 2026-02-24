interface ActivitySummary {
	activityType: string;
	label: string;
	count: number;
}

interface EmployeeSummary {
	userId: string;
	name: string | null;
	image: string | null;
	totalActivities: number;
	topActivity: string;
}

interface EmployeeActivityBreakdown {
	activityType: string;
	label: string;
	count: number;
}

interface TimelineEntry {
	id: bigint;
	activityType: string;
	label: string;
	timestamp: Date;
	tableName: string;
	recordId: string;
}

interface HeatmapCell {
	date: string;
	count: number;
}

interface DailyTrend {
	date: string;
	activityType: string;
	count: number;
}

type TimePreset =
	| 'today'
	| '7d'
	| '30d'
	| 'this_month'
	| 'last_month'
	| 'this_quarter'
	| 'this_year'
	| 'custom';

interface DateRange {
	start: Date;
	end: Date;
	preset: TimePreset;
}

export type {
	ActivitySummary,
	DailyTrend,
	DateRange,
	EmployeeActivityBreakdown,
	EmployeeSummary,
	HeatmapCell,
	TimePreset,
	TimelineEntry,
};
