'use server';

import type { fortinetLevel } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { fortinetRegistrationService } from './service';

type FortinetLevel = (typeof fortinetLevel.enumValues)[number];

export async function getCurrentStudentFortinetRegistrations() {
	return fortinetRegistrationService.getForCurrentStudent();
}

export const createFortinetRegistration = createAction(
	async (data: { level: FortinetLevel; message?: string }) =>
		fortinetRegistrationService.create(data)
);
