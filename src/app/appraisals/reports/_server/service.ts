import type { Session } from '@/core/auth';
import { getSession, withPermission } from '@/core/platform/withPermission';
import type {
	AppraisalReportFilter,
	FeedbackLecturerDetail,
	ObservationLecturerDetail,
	OverviewData,
	ReportAccessInfo,
} from '../_lib/types';
import { appraisalReportsRepository } from './repository';

function hasFeedbackAccess(session: Session | null | undefined) {
	if (!session?.user) {
		return false;
	}

	if (session.user.role === 'admin' || session.user.role === 'human_resource') {
		return true;
	}

	return (
		session.permissions?.some(
			(permission) =>
				permission.resource === 'student-feedback-reports' &&
				permission.action === 'read'
		) ?? false
	);
}

function hasObservationAccess(session: Session | null | undefined) {
	if (!session?.user) {
		return false;
	}

	if (session.user.role === 'admin' || session.user.role === 'human_resource') {
		return true;
	}

	return (
		session.permissions?.some(
			(permission) =>
				permission.resource === 'teaching-observation-reports' &&
				permission.action === 'read'
		) ?? false
	);
}

function hasFullAccess(session: Session | null | undefined) {
	if (!session?.user) {
		return false;
	}

	if (session.user.role === 'admin' || session.user.role === 'human_resource') {
		return true;
	}

	return (
		session.permissions?.some(
			(permission) =>
				(permission.resource === 'student-feedback-reports' ||
					permission.resource === 'teaching-observation-reports') &&
				permission.action === 'update'
		) ?? false
	);
}

function hasAnyReportAccess(session: Session) {
	return hasFeedbackAccess(session) || hasObservationAccess(session);
}

async function requireAnyReportAccess(session: Session) {
	return hasAnyReportAccess(session);
}

async function requireFeedbackAccess(session: Session) {
	return hasFeedbackAccess(session);
}

async function requireObservationAccess(session: Session) {
	return hasObservationAccess(session);
}

class AppraisalReportsService {
	private scopeFilter(
		session: Session | null,
		filter: AppraisalReportFilter
	): AppraisalReportFilter {
		if (!session?.user || hasFullAccess(session)) {
			return filter;
		}

		return {
			...filter,
			lecturerId: session.user.id,
		};
	}

	private maskOverviewData(
		data: OverviewData,
		access: ReportAccessInfo
	): OverviewData {
		const feedbackAllowed = access.hasFeedbackAccess;
		const observationAllowed = access.hasObservationAccess;

		return {
			combinedAvg:
				feedbackAllowed && observationAllowed
					? data.combinedAvg
					: feedbackAllowed
						? data.feedbackAvg
						: observationAllowed
							? data.observationAvg
							: 0,
			feedbackAvg: feedbackAllowed ? data.feedbackAvg : 0,
			observationAvg: observationAllowed ? data.observationAvg : 0,
			lecturersEvaluated: data.lecturersEvaluated,
			schoolComparison: data.schoolComparison.map((item) => ({
				...item,
				feedbackAvg: feedbackAllowed ? item.feedbackAvg : 0,
				observationAvg: observationAllowed ? item.observationAvg : 0,
			})),
			trendData: data.trendData.map((item) => ({
				...item,
				feedbackAvg: feedbackAllowed ? item.feedbackAvg : 0,
				observationAvg: observationAllowed ? item.observationAvg : 0,
			})),
			feedbackHeatmap: feedbackAllowed ? data.feedbackHeatmap : [],
			observationHeatmap: observationAllowed ? data.observationHeatmap : [],
			lecturerRankings: data.lecturerRankings.map((item) => ({
				...item,
				feedbackAvg: feedbackAllowed ? item.feedbackAvg : 0,
				observationAvg: observationAllowed ? item.observationAvg : 0,
				combinedAvg:
					feedbackAllowed && observationAllowed
						? item.combinedAvg
						: feedbackAllowed
							? item.feedbackAvg
							: observationAllowed
								? item.observationAvg
								: 0,
			})),
		};
	}

	private maskFeedbackDetail(
		detail: FeedbackLecturerDetail,
		hasObservation: boolean
	): FeedbackLecturerDetail {
		if (hasObservation) {
			return detail;
		}

		return {
			...detail,
			radarData: detail.radarData.map((item) => ({
				category: item.category,
				feedbackScore: item.feedbackScore,
			})),
		};
	}

	private maskObservationDetail(
		detail: ObservationLecturerDetail,
		hasFeedback: boolean
	): ObservationLecturerDetail {
		if (hasFeedback) {
			return detail;
		}

		return {
			...detail,
			radarData: detail.radarData.map((item) => ({
				category: item.category,
				observationScore: item.observationScore,
			})),
		};
	}

	async getOverviewData(filter: AppraisalReportFilter) {
		return withPermission(async (session) => {
			const access = this.getAccessInfoFromSession(session);
			const scopedFilter = this.scopeFilter(session, filter);
			const data =
				await appraisalReportsRepository.getOverviewData(scopedFilter);
			return this.maskOverviewData(data, access);
		}, requireAnyReportAccess);
	}

	async getFeedbackReportData(filter: AppraisalReportFilter) {
		return withPermission(async (session) => {
			const scopedFilter = this.scopeFilter(session, filter);
			return appraisalReportsRepository.getFeedbackReportData(scopedFilter);
		}, requireFeedbackAccess);
	}

	async getObservationReportData(filter: AppraisalReportFilter) {
		return withPermission(async (session) => {
			const scopedFilter = this.scopeFilter(session, filter);
			return appraisalReportsRepository.getObservationReportData(scopedFilter);
		}, requireObservationAccess);
	}

	async getFeedbackLecturerDetail(
		userId: string,
		filter: AppraisalReportFilter
	) {
		return withPermission(async (session) => {
			if (!hasFullAccess(session) && userId !== session?.user?.id) {
				throw new Error('Access denied');
			}

			const scopedFilter = this.scopeFilter(session, filter);
			const detail = await appraisalReportsRepository.getFeedbackLecturerDetail(
				userId,
				scopedFilter
			);

			if (!detail) {
				return null;
			}

			return this.maskFeedbackDetail(detail, hasObservationAccess(session));
		}, requireFeedbackAccess);
	}

	async getObservationLecturerDetail(
		userId: string,
		filter: AppraisalReportFilter
	) {
		return withPermission(async (session) => {
			if (!hasFullAccess(session) && userId !== session?.user?.id) {
				throw new Error('Access denied');
			}

			const scopedFilter = this.scopeFilter(session, filter);
			const detail =
				await appraisalReportsRepository.getObservationLecturerDetail(
					userId,
					scopedFilter
				);

			if (!detail) {
				return null;
			}

			return this.maskObservationDetail(detail, hasFeedbackAccess(session));
		}, requireObservationAccess);
	}

	async getCyclesByTerm(termId: number) {
		return withPermission(async () => {
			return appraisalReportsRepository.getCyclesByTerm(termId);
		}, requireAnyReportAccess);
	}

	async getAccessInfo() {
		return withPermission(async (session) => {
			return this.getAccessInfoFromSession(session);
		}, requireAnyReportAccess);
	}

	private getAccessInfoFromSession(
		session: Session | null | undefined
	): ReportAccessInfo {
		return {
			hasFullAccess: hasFullAccess(session),
			hasFeedbackAccess: hasFeedbackAccess(session),
			hasObservationAccess: hasObservationAccess(session),
			userId: session?.user?.id,
		};
	}

	async getAccessInfoDirect() {
		const session = await getSession();
		return this.getAccessInfoFromSession(session);
	}
}

export const appraisalReportsService = new AppraisalReportsService();
