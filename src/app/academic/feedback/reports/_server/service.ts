import withAuth from '@/core/platform/withAuth';
import type { FeedbackReportFilter } from '../_lib/types';
import { feedbackReportRepository } from './repository';

class FeedbackReportService {
	async getReportData(filter: FeedbackReportFilter) {
		return withAuth(async () => {
			const [
				overview,
				categoryAverages,
				ratingDistribution,
				lecturerRankings,
				questionBreakdown,
			] = await Promise.all([
				feedbackReportRepository.getOverviewStats(filter),
				feedbackReportRepository.getCategoryAverages(filter),
				feedbackReportRepository.getRatingDistribution(filter),
				feedbackReportRepository.getLecturerRankings(filter),
				feedbackReportRepository.getQuestionBreakdown(filter),
			]);

			return {
				overview,
				categoryAverages,
				ratingDistribution,
				lecturerRankings,
				questionBreakdown,
			};
		}, ['academic', 'admin']);
	}

	async getLecturerDetail(userId: string, filter: FeedbackReportFilter) {
		return withAuth(async () => {
			return feedbackReportRepository.getLecturerDetail(userId, filter);
		}, ['academic', 'admin']);
	}

	async getCyclesByTerm(termId: number) {
		return withAuth(async () => {
			return feedbackReportRepository.getCyclesByTerm(termId);
		}, ['academic', 'admin']);
	}

	async getModulesForFilter(filter: FeedbackReportFilter) {
		return withAuth(async () => {
			return feedbackReportRepository.getModulesForFilter(filter);
		}, ['academic', 'admin']);
	}
}

export const feedbackReportService = new FeedbackReportService();
