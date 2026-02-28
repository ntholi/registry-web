type Department =
	| 'registry'
	| 'academic'
	| 'finance'
	| 'library'
	| 'marketing'
	| 'admin'
	| 'resource'
	| 'human_resource';

interface ActivityEntry {
	label: string;
	department: Department;
}

interface ActivityFragment<
	T extends Record<string, ActivityEntry> = Record<string, ActivityEntry>,
> {
	catalog: T;
	tableOperationMap?: Record<string, string>;
}

function mergeFragments(...fragments: ActivityFragment[]): {
	catalog: Record<string, ActivityEntry>;
	tableOperationMap: Record<string, string>;
} {
	const catalog: Record<string, ActivityEntry> = {};
	const tableOperationMap: Record<string, string> = {};

	for (const fragment of fragments) {
		Object.assign(catalog, fragment.catalog);
		if (fragment.tableOperationMap) {
			Object.assign(tableOperationMap, fragment.tableOperationMap);
		}
	}

	return { catalog, tableOperationMap };
}

function getActivityLabel(
	activityType: string,
	catalog: Record<string, ActivityEntry>
): string {
	const entry = catalog[activityType];
	if (entry) {
		return entry.label;
	}
	return activityType
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupByDepartment(
	catalog: Record<string, ActivityEntry>
): Record<Department, string[]> {
	const result = {} as Record<Department, string[]>;
	for (const [key, entry] of Object.entries(catalog)) {
		const dept = entry.department;
		if (!result[dept]) result[dept] = [];
		result[dept].push(key);
	}
	return result;
}

function isActivityType(
	value: string,
	catalog: Record<string, ActivityEntry>
): boolean {
	return value in catalog;
}

function resolveTableActivity(
	tableName: string,
	operation: 'INSERT' | 'UPDATE' | 'DELETE',
	tableOperationMap: Record<string, string>
): string | undefined {
	const key = `${tableName}:${operation}`;
	return tableOperationMap[key];
}

export {
	type Department,
	type ActivityEntry,
	type ActivityFragment,
	mergeFragments,
	getActivityLabel,
	groupByDepartment,
	isActivityType,
	resolveTableActivity,
};
