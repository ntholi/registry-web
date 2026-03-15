'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { ProgressionFilter } from './repository';
import { progressionReportService } from './service';

export const getProgressionSummary = createAction(
	async (
		prevTermId: number,
		currTermId: number,
		filter?: ProgressionFilter
	) => {
		return progressionReportService.getProgressionSummary(
			prevTermId,
			currTermId,
			filter
		);
	}
);

export const getPaginatedProgressionStudents = createAction(
	async (
		prevTermId: number,
		currTermId: number,
		page: number = 1,
		pageSize: number = 20,
		filter?: ProgressionFilter
	) => {
		return progressionReportService.getPaginatedStudents(
			prevTermId,
			currTermId,
			page,
			pageSize,
			filter
		);
	}
);

export const getProgressionChartData = createAction(
	async (
		prevTermId: number,
		currTermId: number,
		filter?: ProgressionFilter
	) => {
		return progressionReportService.getChartData(
			prevTermId,
			currTermId,
			filter
		);
	}
);
