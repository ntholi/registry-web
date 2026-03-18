import type { Session } from '@/core/auth';
import type { PermissionRequirement } from '@/core/auth/permissions';
import { getSession, withPermission } from '@/core/platform/withPermission';
import type { AccessInfo, ReportFilter } from '../_lib/types';
import { appraisalReportRepository } from './repository';

const FEEDBACK_READ: PermissionRequirement = {
	'student-feedback-reports': ['read'],
};

const OBSERVATION_READ: PermissionRequirement = {
	'teaching-observation-reports': ['read'],
};

function hasPermission(
	session: Session | null | undefined,
	resource: string,
	action: string
) {
	return (
		session?.permissions?.some(
			(p) => p.resource === resource && p.action === action
		) ?? false
	);
}

function hasFullAccess(session: Session | null | undefined) {
	if (!session?.user) return false;
	if (session.user.role === 'admin' || session.user.role === 'human_resource') {
		return true;
	}
	return (
		hasPermission(session, 'student-feedback-reports', 'update') ||
		hasPermission(session, 'teaching-observation-reports', 'update')
	);
}

function hasFeedbackAccess(session: Session | null | undefined) {
	if (!session?.user) return false;
	if (session.user.role === 'admin' || session.user.role === 'human_resource') {
		return true;
	}
	return hasPermission(session, 'student-feedback-reports', 'read');
}

function hasObservationAccess(session: Session | null | undefined) {
	if (!session?.user) return false;
	if (session.user.role === 'admin' || session.user.role === 'human_resource') {
		return true;
	}
	return hasPermission(session, 'teaching-observation-reports', 'read');
}

function scopeFilter(
	session: Session | null,
	filter: ReportFilter
): ReportFilter {
	if (!session?.user) return filter;
	if (hasFullAccess(session)) return filter;
	return { ...filter, lecturerId: session.user.id };
}

async function anyReportAuth(session: Session) {
	return hasFeedbackAccess(session) || hasObservationAccess(session);
}

class AppraisalReportService {
	async getOverviewData(filter: ReportFilter) {
		return withPermission(async (session) => {
			return appraisalReportRepository.getOverviewData(
				scopeFilter(session, filter)
			);
		}, anyReportAuth);
	}

	async getFeedbackReportData(filter: ReportFilter) {
		return withPermission(async (session) => {
			return appraisalReportRepository.getFeedbackReportData(
				scopeFilter(session, filter)
			);
		}, FEEDBACK_READ);
	}

	async getObservationReportData(filter: ReportFilter) {
		return withPermission(async (session) => {
			return appraisalReportRepository.getObservationReportData(
				scopeFilter(session, filter)
			);
		}, OBSERVATION_READ);
	}

	async getFeedbackLecturerDetail(userId: string, filter: ReportFilter) {
		return withPermission(async (session) => {
			if (!hasFullAccess(session) && userId !== session?.user?.id) {
				throw new Error('Access denied');
			}
			return appraisalReportRepository.getFeedbackLecturerDetail(
				userId,
				scopeFilter(session, filter)
			);
		}, FEEDBACK_READ);
	}

	async getObservationLecturerDetail(userId: string, filter: ReportFilter) {
		return withPermission(async (session) => {
			if (!hasFullAccess(session) && userId !== session?.user?.id) {
				throw new Error('Access denied');
			}
			return appraisalReportRepository.getObservationLecturerDetail(
				userId,
				scopeFilter(session, filter)
			);
		}, OBSERVATION_READ);
	}

	async getCyclesByTerm(termId: number) {
		return withPermission(async () => {
			return appraisalReportRepository.getCyclesByTerm(termId);
		}, anyReportAuth);
	}

	async getAccessInfo(): Promise<AccessInfo> {
		const session = await getSession();
		return {
			hasFullAccess: hasFullAccess(session),
			hasFeedbackAccess: hasFeedbackAccess(session),
			hasObservationAccess: hasObservationAccess(session),
		};
	}
}

export const appraisalReportService = new AppraisalReportService();
