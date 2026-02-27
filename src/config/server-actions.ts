'use server';

import { config } from './index';

export async function getConfigDefaults() {
	return config.timetable.timetableAllocations;
}

export async function getStaffEmailDomain() {
	return config.staffEmailDomain;
}
