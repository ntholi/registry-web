import { DashboardUser } from '@/db/schema';
import { getClearanceStatsByDepartment, getUserNamesByIds } from './repository';

export interface ClearanceStats {
  respondedBy: string | null;
  approved: number;
  rejected: number;
  total: number;
  staffName: string;
  approvalRate: number;
}

export async function getDepartmentClearanceStats(
  department: DashboardUser,
): Promise<ClearanceStats[]> {
  const stats = await getClearanceStatsByDepartment(department);

  const userIds = stats
    .map((stat) => stat.respondedBy)
    .filter(Boolean) as string[];
  const users = await getUserNamesByIds(userIds);

  const userNameMap = new Map(users.map((user) => [user.id, user.name]));

  return stats.map((stat) => ({
    ...stat,
    staffName: userNameMap.get(stat.respondedBy || '') || 'Unknown',
    approvalRate:
      stat.total > 0 ? Math.round((stat.approved / stat.total) * 100) : 0,
  }));
}
