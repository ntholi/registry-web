'use server';

import { auth } from '@/auth';
import { DashboardUser } from '@/db/schema';
import { getDepartmentClearanceStats } from './service';
import { ClearanceFilter } from './repository';

export async function fetchClearanceStats(
  department: DashboardUser,
  filter?: ClearanceFilter
) {
  const session = await auth();
  if (!session?.user?.role) {
    throw new Error('Unauthorized');
  }

  if (!['finance', 'library', 'registry', 'academic'].includes(department)) {
    throw new Error('Invalid department');
  }

  return getDepartmentClearanceStats(department, filter);
}
