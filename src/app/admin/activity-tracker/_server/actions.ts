'use server';

import { activityTrackerService as service } from './service';

export async function getDepartmentSummary(
	start: Date,
	end: Date,
	dept?: string
) {
	return service.getDepartmentSummary({ start, end }, dept);
}

export async function getEmployeeList(
	start: Date,
	end: Date,
	page: number,
	search: string,
	dept?: string
) {
	return service.getEmployeeList({ start, end }, page, search, dept);
}

export async function getEmployeeDetail(
	userId: string,
	start: Date,
	end: Date
) {
	return service.getEmployeeActivity(userId, { start, end });
}

export async function getEmployeeTimeline(
	userId: string,
	start: Date,
	end: Date,
	page: number
) {
	return service.getEmployeeTimeline(userId, { start, end }, page);
}

export async function getActivityHeatmap(
	userId: string,
	start: Date,
	end: Date
) {
	return service.getActivityHeatmap(userId, { start, end });
}

export async function getDailyTrends(start: Date, end: Date, dept?: string) {
	return service.getDailyTrends({ start, end }, dept);
}

export async function getEntityBreakdown(
	userId: string,
	start: Date,
	end: Date
) {
	return service.getEntityBreakdown(userId, { start, end });
}

export async function getClearanceStats(start: Date, end: Date, dept?: string) {
	return service.getClearanceStats({ start, end }, dept);
}

export async function getPrintStats(start: Date, end: Date, dept?: string) {
	return service.getPrintStats({ start, end }, dept);
}
