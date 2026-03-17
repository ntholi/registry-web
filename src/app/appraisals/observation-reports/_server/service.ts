import type { Session } from '@/core/auth';
import type { PermissionRequirement } from '@/core/auth/permissions';
import { getSession, withPermission } from '@/core/platform/withPermission';
import type { ObservationReportFilter } from '../_lib/types';
import { observationReportRepository } from './repository';

const REPORT_READ_AUTH: PermissionRequirement = {
	'teaching-observation-reports': ['read'],
};

function hasFullReportAccess(session: Session | null | undefined) {
	if (!session?.user) return false;
	if (session.user.role === 'admin' || session.user.role === 'human_resource') {
		return true;
	}
	return (
		session.permissions?.some(
			(p) =>
				p.resource === 'teaching-observation-reports' && p.action === 'update'
		) ?? false
	);
}

class ObservationReportService {
	private applyLecturerFilter(
		session: Session | null,
		filter: ObservationReportFilter
	): ObservationReportFilter {
		if (!session?.user) return filter;
		if (hasFullReportAccess(session)) return filter;
		return { ...filter, lecturerId: session.user.id };
	}

	async getReportData(filter: ObservationReportFilter) {
		return withPermission(async (session) => {
			const scopedFilter = this.applyLecturerFilter(session, filter);
			const [overview, categoryAverages, lecturerRankings, trendData] =
				await Promise.all([
					observationReportRepository.getOverviewStats(scopedFilter),
					observationReportRepository.getCategoryAverages(scopedFilter),
					observationReportRepository.getLecturerRankings(scopedFilter),
					observationReportRepository.getTrendData(scopedFilter),
				]);

			return { overview, categoryAverages, lecturerRankings, trendData };
		}, REPORT_READ_AUTH);
	}

	async getCyclesByTerm(termId: number) {
		return withPermission(async () => {
			return observationReportRepository.getCyclesByTerm(termId);
		}, REPORT_READ_AUTH);
	}

	async getCriteriaBreakdown(filter: ObservationReportFilter) {
		return withPermission(async (session) => {
			const scopedFilter = this.applyLecturerFilter(session, filter);
			return observationReportRepository.getCriteriaBreakdown(scopedFilter);
		}, REPORT_READ_AUTH);
	}

	async getDetailedExportData(filter: ObservationReportFilter) {
		return withPermission(async (session) => {
			const scopedFilter = this.applyLecturerFilter(session, filter);
			return observationReportRepository.getDetailedExportData(scopedFilter);
		}, REPORT_READ_AUTH);
	}

	async hasFullAccess(): Promise<boolean> {
		const session = await getSession();
		return hasFullReportAccess(session);
	}
}

export const observationReportService = new ObservationReportService();
