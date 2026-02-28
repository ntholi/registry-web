import ACADEMIC_ACTIVITIES from '@academic/_lib/activities';
import ADMIN_ACTIVITIES from '@admin/_lib/activities';
import ADMISSIONS_ACTIVITIES from '@admissions/_lib/activities';
import FINANCE_ACTIVITIES from '@finance/_lib/activities';
import HUMAN_RESOURCE_ACTIVITIES from '@human-resource/_lib/activities';
import LIBRARY_ACTIVITIES from '@library/_lib/activities';
import REGISTRY_ACTIVITIES from '@registry/_lib/activities';
import TIMETABLE_ACTIVITIES from '@timetable/_lib/activities';
import {
	groupByDepartment,
	mergeFragments,
} from '@/shared/lib/utils/activities';

const ALL_FRAGMENTS = [
	REGISTRY_ACTIVITIES,
	ACADEMIC_ACTIVITIES,
	FINANCE_ACTIVITIES,
	LIBRARY_ACTIVITIES,
	ADMISSIONS_ACTIVITIES,
	ADMIN_ACTIVITIES,
	TIMETABLE_ACTIVITIES,
	HUMAN_RESOURCE_ACTIVITIES,
] as const;

export const ACTIVITY_CATALOG = mergeFragments(...ALL_FRAGMENTS);

export type ActivityType = keyof typeof ACTIVITY_CATALOG.catalog;

export const TABLE_OPERATION_MAP = ACTIVITY_CATALOG.tableOperationMap;

export const ACTIVITY_LABELS: Record<ActivityType, string> = Object.fromEntries(
	Object.entries(ACTIVITY_CATALOG.catalog).map(([key, val]) => [key, val.label])
) as Record<ActivityType, string>;

export const DEPARTMENT_ACTIVITIES = groupByDepartment(
	ACTIVITY_CATALOG.catalog
);

export function getActivityLabel(activityType: string): string {
	const entry = ACTIVITY_CATALOG.catalog[activityType];
	if (entry) return entry.label;
	return activityType
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isActivityType(value: string): value is ActivityType {
	return value in ACTIVITY_CATALOG.catalog;
}

export function resolveTableActivity(
	tableName: string,
	operation: 'INSERT' | 'UPDATE' | 'DELETE'
): ActivityType | undefined {
	const key = `${tableName}:${operation}`;
	return TABLE_OPERATION_MAP[key] as ActivityType | undefined;
}
