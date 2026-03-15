'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import { activityTrackerService as service } from './service';

export const getDepartmentSummary = createAction(
	async (start: string, end: string, dept?: string) => {
		return service.getDepartmentSummary(new Date(start), new Date(end), dept);
	}
);

export const getEmployeeList = createAction(
	async (
		start: string,
		end: string,
		page: number,
		search: string,
		dept?: string
	) => {
		return service.getEmployeeList(
			new Date(start),
			new Date(end),
			page,
			search,
			dept
		);
	}
);

export const getEmployeeActivityBreakdown = createAction(
	async (userId: string, start: string, end: string) => {
		return service.getEmployeeActivityBreakdown(
			userId,
			new Date(start),
			new Date(end)
		);
	}
);

export const getEmployeeTimeline = createAction(
	async (userId: string, start: string, end: string, page: number) => {
		return service.getEmployeeTimeline(
			userId,
			new Date(start),
			new Date(end),
			page
		);
	}
);

export const getActivityHeatmap = createAction(
	async (userId: string, start: string, end: string) => {
		return service.getActivityHeatmap(userId, new Date(start), new Date(end));
	}
);

export const getDailyTrends = createAction(
	async (start: string, end: string, dept?: string) => {
		return service.getDailyTrends(new Date(start), new Date(end), dept);
	}
);

export const getEmployeeUser = createAction(async (userId: string) => {
	return service.getEmployeeUser(userId);
});

export const getEmployeeTotalActivities = createAction(
	async (userId: string, start: string, end: string) => {
		return service.getEmployeeTotalActivities(
			userId,
			new Date(start),
			new Date(end)
		);
	}
);
