import type { DashboardUser } from '@/shared/db/schema';
import {
	type ClearanceFilter,
	getClearanceStatsByDepartment,
	getUserNamesByIds,
} from './repository';

export interface ClearanceStats {
	respondedBy: string | null;
	approved: number;
	rejected: number;
	total: number;
	staffName: string;
	approvalRate: number;
}

export interface ClearanceStatsOverall {
	total: number;
	approved: number;
	rejected: number;
	pending: number;
	approvalRate: number;
}

export interface ClearanceStatsSummary {
	overall: ClearanceStatsOverall;
	byStaff: ClearanceStats[];
}

export async function getDepartmentClearanceStats(
	department: DashboardUser,
	filter?: ClearanceFilter
): Promise<ClearanceStatsSummary> {
	const stats = await getClearanceStatsByDepartment(department, filter);

	const userIds = stats.staff
		.map((stat) => stat.respondedBy)
		.filter(Boolean) as string[];

	const users = await getUserNamesByIds(userIds);
	const userNameMap = new Map(users.map((user) => [user.id, user.name]));

	const staffStats = stats.staff.map((stat) => ({
		...stat,
		staffName: userNameMap.get(stat.respondedBy || '') || 'Unknown',
		approvalRate:
			stat.total > 0 ? Math.round((stat.approved / stat.total) * 100) : 0,
	}));

	const overallStats = {
		...stats.overall,
		approvalRate:
			stats.overall.total > 0
				? Math.round((stats.overall.approved / stats.overall.total) * 100)
				: 0,
	};

	return {
		overall: overallStats,
		byStaff: staffStats,
	};
}
