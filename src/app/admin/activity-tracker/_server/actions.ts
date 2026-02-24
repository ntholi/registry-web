'use server';

import { activityTrackerService as service } from './service';

export async function getDepartmentSummary(
	start: string,
	end: string,
	dept?: string
) {
	return service.getDepartmentSummary(new Date(start), new Date(end), dept);
}

export async function getEmployeeList(
	start: string,
	end: string,
	page: number,
	search: string,
	dept?: string
) {
	return service.getEmployeeList(
		new Date(start),
		new Date(end),
		page,
		search,
		dept
	);
}

export async function getEmployeeActivityBreakdown(
	userId: string,
	start: string,
	end: string
) {
	return service.getEmployeeActivityBreakdown(
		userId,
		new Date(start),
		new Date(end)
	);
}

export async function getEmployeeTimeline(
	userId: string,
	start: string,
	end: string,
	page: number
) {
	return service.getEmployeeTimeline(
		userId,
		new Date(start),
		new Date(end),
		page
	);
}

export async function getActivityHeatmap(
	userId: string,
	start: string,
	end: string
) {
	return service.getActivityHeatmap(userId, new Date(start), new Date(end));
}

export async function getDailyTrends(
	start: string,
	end: string,
	dept?: string
) {
	return service.getDailyTrends(new Date(start), new Date(end), dept);
}

export async function getEmployeeUser(userId: string) {
	return service.getEmployeeUser(userId);
}

export async function getEmployeeTotalActivities(
	userId: string,
	start: string,
	end: string
) {
	return service.getEmployeeTotalActivities(
		userId,
		new Date(start),
		new Date(end)
	);
}
