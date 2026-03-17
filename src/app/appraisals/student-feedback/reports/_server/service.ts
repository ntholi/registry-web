import type { Session } from '@/core/auth';
import type { PermissionRequirement } from '@/core/auth/permissions';
import { getSession, withPermission } from '@/core/platform/withPermission';
import type { StudentFeedbackReportFilter } from '../_lib/types';
import { studentFeedbackReportRepository } from './repository';

const REPORT_READ_AUTH: PermissionRequirement = {
	'student-feedback-reports': ['read'],
};

function hasReportPermission(
	session: Session | null | undefined,
	action: 'read' | 'update'
) {
	return (
		session?.permissions?.some(
			(permission) =>
				permission.resource === 'student-feedback-reports' &&
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

class StudentFeedbackReportService {
	private applyLecturerFilter(
		session: Session | null,
		filter: StudentFeedbackReportFilter
	): StudentFeedbackReportFilter {
		if (!session?.user) return filter;
		if (hasFullReportAccess(session)) return filter;
		return { ...filter, lecturerId: session.user.id };
	}

	async getReportData(filter: StudentFeedbackReportFilter) {
		return withPermission(async (session) => {
			const scopedFilter = this.applyLecturerFilter(session, filter);
			const [
				overview,
				categoryAverages,
				ratingDistribution,
				lecturerRankings,
				questionBreakdown,
			] = await Promise.all([
				studentFeedbackReportRepository.getOverviewStats(scopedFilter),
				studentFeedbackReportRepository.getCategoryAverages(scopedFilter),
				studentFeedbackReportRepository.getRatingDistribution(scopedFilter),
				studentFeedbackReportRepository.getLecturerRankings(scopedFilter),
				studentFeedbackReportRepository.getQuestionBreakdown(scopedFilter),
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

	async getLecturerDetail(userId: string, filter: StudentFeedbackReportFilter) {
		return withPermission(async (session) => {
			const scopedFilter = this.applyLecturerFilter(session, filter);
			if (!hasFullReportAccess(session) && userId !== session?.user?.id) {
				throw new Error('Access denied');
			}
			return studentFeedbackReportRepository.getLecturerDetail(
				userId,
				scopedFilter
			);
		}, REPORT_READ_AUTH);
	}

	async getCyclesByTerm(termId: number) {
		return withPermission(async () => {
			return studentFeedbackReportRepository.getCyclesByTerm(termId);
		}, REPORT_READ_AUTH);
	}

	async getModulesForFilter(filter: StudentFeedbackReportFilter) {
		return withPermission(async () => {
			return studentFeedbackReportRepository.getModulesForFilter(filter);
		}, REPORT_READ_AUTH);
	}

	async hasFullAccess(): Promise<boolean> {
		const session = await getSession();
		return (
			hasFullReportAccess(session) || hasReportPermission(session, 'update')
		);
	}
}

export const studentFeedbackReportService = new StudentFeedbackReportService();
