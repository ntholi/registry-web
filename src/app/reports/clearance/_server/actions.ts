'use server';

import { auth } from '@/core/auth';
import type { DashboardUser } from '@/core/database';
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
