'use server';

import type { ProgressionFilter } from './repository';
import { progressionReportService } from './service';

export async function getProgressionSummary(
	prevTermId: number,
	currTermId: number,
	filter?: ProgressionFilter
) {
	try {
		const data = await progressionReportService.getProgressionSummary(
			prevTermId,
			currTermId,
			filter
		);
		return { success: true as const, data };
	} catch (error) {
		console.error('Error fetching progression summary:', error);
		return {
			success: false as const,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getPaginatedProgressionStudents(
	prevTermId: number,
	currTermId: number,
	page: number = 1,
	pageSize: number = 20,
	filter?: ProgressionFilter
) {
	try {
		const data = await progressionReportService.getPaginatedStudents(
			prevTermId,
			currTermId,
			page,
			pageSize,
			filter
		);
		return { success: true as const, data };
	} catch (error) {
		console.error('Error fetching paginated progression students:', error);
		return {
			success: false as const,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getProgressionChartData(
	prevTermId: number,
	currTermId: number,
	filter?: ProgressionFilter
) {
	try {
		const data = await progressionReportService.getChartData(
			prevTermId,
			currTermId,
			filter
		);
		return { success: true as const, data };
	} catch (error) {
		console.error('Error fetching progression chart data:', error);
		return {
			success: false as const,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
