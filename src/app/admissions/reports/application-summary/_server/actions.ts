'use server';

import type { AdmissionReportFilter } from '../../_shared/types';
import { applicationSummaryService } from './service';

export async function getApplicationSummary(filter: AdmissionReportFilter) {
	return applicationSummaryService.getSummaryData(filter);
}

export async function getApplicationChartData(filter: AdmissionReportFilter) {
	return applicationSummaryService.getChartData(filter);
}

export async function exportApplicationSummaryExcel(
	filter: AdmissionReportFilter
) {
	const buffer = await applicationSummaryService.exportExcel(filter);
	return Buffer.from(buffer).toString('base64');
}
