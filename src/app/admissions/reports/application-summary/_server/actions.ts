'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { AdmissionReportFilter } from '../../_shared/types';
import { applicationSummaryService } from './service';

export const getApplicationSummary = createAction(
	async (filter: AdmissionReportFilter) => {
		return applicationSummaryService.getSummaryData(filter);
	}
);

export const getApplicationChartData = createAction(
	async (filter: AdmissionReportFilter) => {
		return applicationSummaryService.getChartData(filter);
	}
);

export const exportApplicationSummaryExcel = createAction(
	async (filter: AdmissionReportFilter) => {
		const buffer = await applicationSummaryService.exportExcel(filter);
		return Buffer.from(buffer).toString('base64');
	}
);
