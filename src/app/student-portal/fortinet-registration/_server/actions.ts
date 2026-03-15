'use server';

import type { fortinetLevel } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { fortinetRegistrationService } from './service';

type FortinetLevel = (typeof fortinetLevel.enumValues)[number];

export const getCurrentStudentFortinetRegistrations = createAction(async () => {
	return fortinetRegistrationService.getForCurrentStudent();
});

export const createFortinetRegistration = createAction(
	async (data: { level: FortinetLevel; message?: string }) => {
		return fortinetRegistrationService.create(data);
	}
);
