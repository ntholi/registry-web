'use server';

import type { ReportFilter } from '../_lib/types';
import { appraisalReportService } from './service';

export async function getOverviewData(filter: ReportFilter) {
	return appraisalReportService.getOverviewData(filter);
}

export async function getFeedbackReportData(filter: ReportFilter) {
	return appraisalReportService.getFeedbackReportData(filter);
}

export async function getObservationReportData(filter: ReportFilter) {
	return appraisalReportService.getObservationReportData(filter);
}

export async function getFeedbackLecturerDetail(
	userId: string,
	filter: ReportFilter
) {
	return appraisalReportService.getFeedbackLecturerDetail(userId, filter);
}

export async function getObservationLecturerDetail(
	userId: string,
	filter: ReportFilter
) {
	return appraisalReportService.getObservationLecturerDetail(userId, filter);
}

export async function getCyclesByTerm(termId: number) {
	return appraisalReportService.getCyclesByTerm(termId);
}

export async function getReportAccessInfo() {
	return appraisalReportService.getAccessInfo();
}

export async function getModulesForFilter(filter: ReportFilter) {
	return appraisalReportService.getModulesForFilter(filter);
}
