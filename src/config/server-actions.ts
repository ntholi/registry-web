'use server';

import { config } from './index';

export async function getConfigDefaults() {
	return config.timetable.lecturerAllocations;
}
