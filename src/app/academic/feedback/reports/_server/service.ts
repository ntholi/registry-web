import type { Session } from 'next-auth';
import { auth } from '@/core/auth';
import withAuth from '@/core/platform/withPermission';
import type { FeedbackReportFilter } from '../_lib/types';
import { feedbackReportRepository } from './repository';

const FULL_ACCESS_POSITIONS = ['admin', 'manager'];

function canViewReports(session: Session) {
	if (session.user?.role === 'human_resource') return Promise.resolve(true);
	if (session.user?.role === 'academic') return Promise.resolve(true);
	return Promise.resolve(false);
}

function hasFullReportAccess(session: Session) {
	if (session.user?.role === 'human_resource') return true;
	if (
		session.user?.role === 'academic' &&
		FULL_ACCESS_POSITIONS.includes(session.user.position ?? '')
	)
		return true;
	return false;
}

class FeedbackReportService {
	private async applyLecturerFilter(
		filter: FeedbackReportFilter
	): Promise<FeedbackReportFilter> {
		const session = await auth();
		if (!session?.user) return filter;
		if (session.user.role === 'admin') return filter;
		if (hasFullReportAccess(session)) return filter;
		return { ...filter, lecturerId: session.user.id };
	}

	async getReportData(filter: FeedbackReportFilter) {
		const scopedFilter = await this.applyLecturerFilter(filter);
		return withAuth(async () => {
			const [
				overview,
				categoryAverages,
				ratingDistribution,
				lecturerRankings,
				questionBreakdown,
			] = await Promise.all([
				feedbackReportRepository.getOverviewStats(scopedFilter),
				feedbackReportRepository.getCategoryAverages(scopedFilter),
				feedbackReportRepository.getRatingDistribution(scopedFilter),
				feedbackReportRepository.getLecturerRankings(scopedFilter),
				feedbackReportRepository.getQuestionBreakdown(scopedFilter),
			]);

			return {
				overview,
				categoryAverages,
				ratingDistribution,
				lecturerRankings,
				questionBreakdown,
			};
		}, canViewReports);
	}

	async getLecturerDetail(userId: string, filter: FeedbackReportFilter) {
		const scopedFilter = await this.applyLecturerFilter(filter);
		return withAuth(async (session) => {
			if (
				!hasFullReportAccess(session!) &&
				session?.user?.role !== 'admin' &&
				userId !== session?.user?.id
			) {
				throw new Error('Access denied');
			}
			return feedbackReportRepository.getLecturerDetail(userId, scopedFilter);
		}, canViewReports);
	}

	async getCyclesByTerm(termId: number) {
		return withAuth(async () => {
			return feedbackReportRepository.getCyclesByTerm(termId);
		}, canViewReports);
	}

	async getModulesForFilter(filter: FeedbackReportFilter) {
		return withAuth(async () => {
			return feedbackReportRepository.getModulesForFilter(filter);
		}, canViewReports);
	}

	async hasFullAccess(): Promise<boolean> {
		const session = await auth();
		if (!session?.user) return false;
		if (session.user.role === 'admin') return true;
		return hasFullReportAccess(session);
	}
}

export const feedbackReportService = new FeedbackReportService();
