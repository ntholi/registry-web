import type { Session } from '@/core/auth';
import type { PermissionRequirement } from '@/core/auth/permissions';
import { getSession, withPermission } from '@/core/platform/withPermission';
import type { FeedbackReportFilter } from '../_lib/types';
import { feedbackReportRepository } from './repository';

const REPORT_READ_AUTH: PermissionRequirement = {
	'feedback-reports': ['read'],
};

function hasReportPermission(
	session: Session | null | undefined,
	action: 'read' | 'update'
) {
	return (
		session?.permissions?.some(
			(permission) =>
				permission.resource === 'feedback-reports' &&
				permission.action === action
		) ?? false
	);
}

function hasFullReportAccess(session: Session | null | undefined) {
	if (!session?.user) return false;
	if (session.user.role === 'admin' || session.user.role === 'human_resource') {
		return true;
	}
	return hasReportPermission(session, 'update');
}

class FeedbackReportService {
	private applyLecturerFilter(
		session: Session | null,
		filter: FeedbackReportFilter
	): FeedbackReportFilter {
		if (!session?.user) return filter;
		if (hasFullReportAccess(session)) return filter;
		return { ...filter, lecturerId: session.user.id };
	}

	async getReportData(filter: FeedbackReportFilter) {
		return withPermission(async (session) => {
			const scopedFilter = this.applyLecturerFilter(session, filter);
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
		}, REPORT_READ_AUTH);
	}

	async getLecturerDetail(userId: string, filter: FeedbackReportFilter) {
		return withPermission(async (session) => {
			const scopedFilter = this.applyLecturerFilter(session, filter);
			if (!hasFullReportAccess(session) && userId !== session?.user?.id) {
				throw new Error('Access denied');
			}
			return feedbackReportRepository.getLecturerDetail(userId, scopedFilter);
		}, REPORT_READ_AUTH);
	}

	async getCyclesByTerm(termId: number) {
		return withPermission(async () => {
			return feedbackReportRepository.getCyclesByTerm(termId);
		}, REPORT_READ_AUTH);
	}

	async getModulesForFilter(filter: FeedbackReportFilter) {
		return withPermission(async () => {
			return feedbackReportRepository.getModulesForFilter(filter);
		}, REPORT_READ_AUTH);
	}

	async hasFullAccess(): Promise<boolean> {
		const session = await getSession();
		return (
			hasFullReportAccess(session) || hasReportPermission(session, 'update')
		);
	}
}

export const feedbackReportService = new FeedbackReportService();
