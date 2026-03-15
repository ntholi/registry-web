'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { BoeFilter } from './repository';
import { boeReportService } from './service';

export const getPreview = createAction(async (filter: BoeFilter) => {
	return boeReportService.getPreview(filter);
});

export const getStatistics = createAction(async (filter: BoeFilter) => {
	return boeReportService.getStatistics(filter);
});

export const getClassReports = createAction(async (filter: BoeFilter) => {
	return boeReportService.getClassReports(filter);
});

export const generateExcel = createAction(async (filter: BoeFilter) => {
	const buffer = await boeReportService.generateExcel(filter);
	return Buffer.from(buffer).toString('base64');
});
