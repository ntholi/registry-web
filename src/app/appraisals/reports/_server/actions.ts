'use server';

import type {
	FeedbackReportData,
	ObservationReportData,
	ReportFilter,
} from '../_lib/types';
import { generateFeedbackExcel } from './feedback-excel';
import { generateObservationExcel } from './observation-excel';
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

export async function exportFeedbackExcel(
	data: FeedbackReportData,
	filter: ReportFilter
) {
	const buffer = await generateFeedbackExcel(data, filter);
	return buffer.toString('base64');
}

export async function exportObservationExcel(
	data: ObservationReportData,
	filter: ReportFilter
) {
	const buffer = await generateObservationExcel(data, filter);
	return buffer.toString('base64');
}
