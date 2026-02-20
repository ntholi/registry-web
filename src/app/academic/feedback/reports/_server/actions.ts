'use server';

import type { FeedbackReportData, FeedbackReportFilter } from '../_lib/types';
import { generateFeedbackExcel } from './excel';
import { feedbackReportService } from './service';

export async function getFeedbackReportData(filter: FeedbackReportFilter) {
	return feedbackReportService.getReportData(filter);
}

export async function getFeedbackLecturerDetail(
	userId: string,
	filter: FeedbackReportFilter
) {
	return feedbackReportService.getLecturerDetail(userId, filter);
}

export async function getFeedbackCyclesByTerm(termId: number) {
	return feedbackReportService.getCyclesByTerm(termId);
}

export async function getFeedbackModulesForFilter(
	filter: FeedbackReportFilter
) {
	return feedbackReportService.getModulesForFilter(filter);
}

export async function exportFeedbackReportExcel(
	data: FeedbackReportData,
	filter: FeedbackReportFilter
) {
	const buffer = await generateFeedbackExcel(data, filter);
	return buffer.toString('base64');
}
