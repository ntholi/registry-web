import type { ClearanceDept } from './constants';

type ClearanceRow = { clearance: { status: string; department: string } };

export function getClearanceStatus<T extends ClearanceRow>(
	clearances: T[] | undefined,
	requiredDepts: readonly ClearanceDept[]
) {
	if (!clearances || clearances.length === 0) return 'pending';

	const relevant = clearances.filter((c) =>
		(requiredDepts as readonly string[]).includes(c.clearance.department)
	);
	if (relevant.length === 0) return 'pending';

	if (relevant.some((c) => c.clearance.status === 'rejected'))
		return 'rejected';
	if (relevant.every((c) => c.clearance.status === 'approved'))
		return 'approved';

	return 'pending';
}

export function getOverallClearanceStatus<T extends ClearanceRow>(
	clearances: T[] | undefined,
	requiredDepts: readonly ClearanceDept[]
) {
	const deptStatuses = requiredDepts.map((dept) => {
		const match = clearances?.find((c) => c.clearance.department === dept);
		return match?.clearance.status || 'pending';
	});

	if (deptStatuses.some((s) => s === 'rejected')) return 'rejected';
	if (deptStatuses.some((s) => s === 'pending')) return 'pending';
	return 'approved';
}
