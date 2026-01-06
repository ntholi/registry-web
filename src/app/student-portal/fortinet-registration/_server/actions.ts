'use server';

import type { fortinetLevel } from '@/core/database';
import { fortinetRegistrationService } from './service';

type FortinetLevel = (typeof fortinetLevel.enumValues)[number];

export async function getCurrentStudentFortinetRegistrations() {
	return fortinetRegistrationService.getForCurrentStudent();
}

export async function createFortinetRegistration(data: {
	level: FortinetLevel;
	message?: string;
}) {
	return fortinetRegistrationService.create(data);
}
