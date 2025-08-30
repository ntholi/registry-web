'use server';

import { clearance, DashboardUser } from '@/db/schema';
import { graduationClearanceService as service } from './service';
import { auth } from '@/auth';

type Clearance = typeof clearance.$inferInsert;

export async function getGraduationClearance(id: number) {
  return service.get(id);
}

export async function countPendingGraduationClearances() {
  return service.countByStatus('pending');
}

export async function countApprovedGraduationClearances() {
  return service.countByStatus('approved');
}

export async function countRejectedGraduationClearances() {
  return service.countByStatus('rejected');
}

export async function graduationClearanceByStatus(
  status: 'pending' | 'approved' | 'rejected',
  page: number = 1,
  search = ''
) {
  const session = await auth();
  if (!session?.user?.role) {
    return {
      items: [],
      totalPages: 0,
    };
  }

  const res = await service.findByDepartment(
    session.user.role as DashboardUser,
    { page, search },
    status
  );
  return { items: res.items, totalPages: res.totalPages };
}

export async function updateGraduationClearance(id: number, data: Clearance) {
  return service.update(id, data);
}

export async function deleteGraduationClearance(id: number) {
  return service.delete(id);
}
