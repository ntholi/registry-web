'use server';

import { createAction } from '@/shared/lib/actions/actionResult';
import type { FeedbackReportData, FeedbackReportFilter } from '../_lib/types';
import { generateFeedbackExcel } from './excel';
import { feedbackReportService } from './service';

export const getFeedbackReportData = createAction(
	async (filter: FeedbackReportFilter) =>
		feedbackReportService.getReportData(filter)
);

export const getFeedbackLecturerDetail = createAction(
	async (userId: string, filter: FeedbackReportFilter) =>
		feedbackReportService.getLecturerDetail(userId, filter)
);

export const getFeedbackCyclesByTerm = createAction(async (termId: number) =>
	feedbackReportService.getCyclesByTerm(termId)
);

export const getFeedbackModulesForFilter = createAction(
	async (filter: FeedbackReportFilter) =>
		feedbackReportService.getModulesForFilter(filter)
);

export const exportFeedbackReportExcel = createAction(
	async (data: FeedbackReportData, filter: FeedbackReportFilter) => {
		const buffer = await generateFeedbackExcel(data, filter);
		return buffer.toString('base64');
	}
);

export const checkFullReportAccess = createAction(async () =>
	feedbackReportService.hasFullAccess()
);
