'use server';

import { auth } from '@/auth';
import type { DashboardUser } from '@/shared/db/schema';
import type { ClearanceFilter } from './repository';
import { getDepartmentClearanceStats } from './service';

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
