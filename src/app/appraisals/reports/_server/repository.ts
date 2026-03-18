import {
	and,
	avg,
	count,
	countDistinct,
	eq,
	inArray,
	isNotNull,
	sql,
} from 'drizzle-orm';
import {
	assignedModules,
	db,
	feedbackCycles,
	modules,
	observationCategories,
	observationCriteria,
	observationRatings,
	observations,
	programs,
	schools,
	semesterModules,
	structureSemesters,
	structures,
	studentFeedbackCategories,
	studentFeedbackPassphrases,
	studentFeedbackQuestions,
	studentFeedbackResponses,
	terms,
	users,
} from '@/core/database';
import type {
	CategoryAverage,
	CriteriaScore,
	CriterionBreakdownItem,
	CycleOption,
	FeedbackLecturerDetail,
	FeedbackLecturerRanking,
	FeedbackOverviewStats,
	FeedbackReportData,
	FeedbackTrendPoint,
	HeatmapCell,
	LecturerComment,
	LecturerModuleBreakdown,
	LecturerQuestionDetail,
	ObservationCategoryAverage,
	ObservationDetail,
	ObservationLecturerDetail,
	ObservationLecturerRanking,
	ObservationOverviewStats,
	ObservationReportData,
	ObservationTrendPoint,
	OverviewData,
	OverviewLecturerRanking,
	RadarDataPoint,
	ReportFilter,
	SchoolComparisonItem,
	TrendPoint,
} from '../_lib/types';

function buildFeedbackConditions(filter: ReportFilter) {
	const conditions = [];
	if (filter.termId) {
		conditions.push(eq(feedbackCycles.termId, filter.termId));
	}
	if (filter.cycleId) {
		conditions.push(eq(studentFeedbackPassphrases.cycleId, filter.cycleId));
	}
	if (filter.schoolIds && filter.schoolIds.length > 0) {
		conditions.push(inArray(schools.id, filter.schoolIds));
	}
	if (filter.programId) {
		conditions.push(eq(programs.id, filter.programId));
	}
	if (filter.lecturerId) {
		conditions.push(eq(assignedModules.userId, filter.lecturerId));
	}
	return conditions;
}

function buildObservationConditions(filter: ReportFilter) {
	const conditions = [
		inArray(observations.status, ['submitted', 'acknowledged']),
	];
	if (filter.termId) {
		conditions.push(eq(feedbackCycles.termId, filter.termId));
	}
	if (filter.cycleId) {
		conditions.push(eq(observations.cycleId, filter.cycleId));
	}
	if (filter.schoolIds && filter.schoolIds.length > 0) {
		conditions.push(inArray(schools.id, filter.schoolIds));
	}
	if (filter.programId) {
		conditions.push(eq(programs.id, filter.programId));
	}
	if (filter.lecturerId) {
		conditions.push(eq(assignedModules.userId, filter.lecturerId));
	}
	return conditions;
}

function toFixed2(val: string | number | null) {
	return Number.parseFloat((Number(val) || 0).toFixed(2));
}

class AppraisalReportRepository {
	async getOverviewData(filter: ReportFilter): Promise<OverviewData> {
		const [
			feedbackAvgResult,
			observationAvgResult,
			schoolComparison,
			trendData,
			feedbackHeatmap,
			observationHeatmap,
			lecturerRankings,
		] = await Promise.all([
			this.getFeedbackAvg(filter),
			this.getObservationAvg(filter),
			this.getSchoolComparison(filter),
			this.getOverviewTrend(filter),
			this.getFeedbackHeatmap(filter),
			this.getObservationHeatmap(filter),
			this.getOverviewLecturerRankings(filter),
		]);

		const feedbackAvg = feedbackAvgResult.avgRating;
		const observationAvg = observationAvgResult.avgRating;
		const lecturerSets = new Set([
			...feedbackAvgResult.lecturerIds,
			...observationAvgResult.lecturerIds,
		]);

		const sources = [feedbackAvg, observationAvg].filter((v) => v > 0);
		const combinedAvg =
			sources.length > 0
				? toFixed2(sources.reduce((a, b) => a + b, 0) / sources.length)
				: 0;

		return {
			combinedAvg,
			feedbackAvg,
			observationAvg,
			lecturersEvaluated: lecturerSets.size,
			schoolComparison,
			trendData,
			feedbackHeatmap,
			observationHeatmap,
			lecturerRankings,
		};
	}

	async getFeedbackReportData(
		filter: ReportFilter
	): Promise<FeedbackReportData> {
		const [overview, categoryAverages, trendData, lecturerRankings] =
			await Promise.all([
				this.getFeedbackOverviewStats(filter),
				this.getFeedbackCategoryAverages(filter),
				this.getFeedbackTrendData(filter),
				this.getFeedbackLecturerRankings(filter),
			]);
		return { overview, categoryAverages, trendData, lecturerRankings };
	}

	async getObservationReportData(
		filter: ReportFilter
	): Promise<ObservationReportData> {
		const [
			overview,
			categoryAverages,
			trendData,
			lecturerRankings,
			criteriaBreakdown,
		] = await Promise.all([
			this.getObservationOverviewStats(filter),
			this.getObservationCategoryAverages(filter),
			this.getObservationTrendData(filter),
			this.getObservationLecturerRankings(filter),
			this.getCriteriaBreakdown(filter),
		]);
		return {
			overview,
			categoryAverages,
			trendData,
			lecturerRankings,
			criteriaBreakdown,
		};
	}

	async getFeedbackLecturerDetail(
		userId: string,
		filter: ReportFilter
	): Promise<FeedbackLecturerDetail | null> {
		const conditions = buildFeedbackConditions(filter);
		const allConditions = [
			eq(assignedModules.userId, userId),
			isNotNull(studentFeedbackResponses.rating),
			...conditions,
		];

		const [lecturerInfo] = await db
			.select({
				userId: assignedModules.userId,
				lecturerName: users.name,
				schoolCode: schools.code,
				avgRating: avg(studentFeedbackResponses.rating),
			})
			.from(studentFeedbackResponses)
			.innerJoin(
				assignedModules,
				eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(users, eq(assignedModules.userId, users.id))
			.innerJoin(
				studentFeedbackPassphrases,
				eq(studentFeedbackResponses.passphraseId, studentFeedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(
					studentFeedbackPassphrases.structureSemesterId,
					structureSemesters.id
				)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(and(...allConditions))
			.groupBy(assignedModules.userId, users.name, schools.code);

		if (!lecturerInfo) return null;

		const [mods, questions, comments, radarData] = await Promise.all([
			this.getLecturerModules(userId, allConditions),
			this.getLecturerQuestions(userId, allConditions, filter),
			this.getLecturerComments(userId, conditions),
			this.getRadarData(userId, filter),
		]);

		return {
			userId: lecturerInfo.userId,
			lecturerName: lecturerInfo.lecturerName ?? 'Unknown',
			schoolCode: lecturerInfo.schoolCode,
			avgRating: toFixed2(lecturerInfo.avgRating),
			modules: mods,
			questions,
			comments,
			radarData,
		};
	}

	async getObservationLecturerDetail(
		userId: string,
		filter: ReportFilter
	): Promise<ObservationLecturerDetail | null> {
		const obsConditions = buildObservationConditions(filter);
		const allObsConditions = [
			eq(assignedModules.userId, userId),
			...obsConditions,
		];

		const [lecturerInfo] = await db
			.select({
				userId: assignedModules.userId,
				lecturerName: users.name,
				schoolCode: schools.code,
				avgScore: avg(observationRatings.rating),
			})
			.from(observationRatings)
			.innerJoin(
				observations,
				eq(observationRatings.observationId, observations.id)
			)
			.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(users, eq(assignedModules.userId, users.id))
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(isNotNull(observationRatings.rating), ...allObsConditions))
			.groupBy(assignedModules.userId, users.name, schools.code);

		if (!lecturerInfo) return null;

		const [obs, criteriaScores, radarData, feedbackCrossRef] =
			await Promise.all([
				this.getObservationsForLecturer(userId, allObsConditions),
				this.getCriteriaScoresForLecturer(userId, allObsConditions),
				this.getRadarData(userId, filter),
				this.getFeedbackCrossRef(userId, filter),
			]);

		return {
			userId: lecturerInfo.userId,
			lecturerName: lecturerInfo.lecturerName ?? 'Unknown',
			schoolCode: lecturerInfo.schoolCode,
			avgScore: toFixed2(lecturerInfo.avgScore),
			observations: obs,
			criteriaScores,
			radarData,
			feedbackCrossRef,
		};
	}

	async getCyclesByTerm(termId: number): Promise<CycleOption[]> {
		return db
			.select({ id: feedbackCycles.id, name: feedbackCycles.name })
			.from(feedbackCycles)
			.where(eq(feedbackCycles.termId, termId))
			.orderBy(feedbackCycles.name);
	}

	private async getFeedbackAvg(filter: ReportFilter) {
		const conditions = buildFeedbackConditions(filter);
		const [result] = await db
			.select({
				avgRating: avg(studentFeedbackResponses.rating),
				lecturerIds: sql<
					string[]
				>`array_agg(distinct ${assignedModules.userId})`,
			})
			.from(studentFeedbackResponses)
			.innerJoin(
				studentFeedbackPassphrases,
				eq(studentFeedbackResponses.passphraseId, studentFeedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(
					studentFeedbackPassphrases.structureSemesterId,
					structureSemesters.id
				)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				assignedModules,
				eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(
				and(
					isNotNull(studentFeedbackResponses.rating),
					...(conditions.length > 0 ? conditions : [])
				)
			);
		return {
			avgRating: toFixed2(result?.avgRating),
			lecturerIds: (result?.lecturerIds ?? []).filter(Boolean),
		};
	}

	private async getObservationAvg(filter: ReportFilter) {
		const conditions = buildObservationConditions(filter);
		const [result] = await db
			.select({
				avgRating: avg(observationRatings.rating),
				lecturerIds: sql<
					string[]
				>`array_agg(distinct ${assignedModules.userId})`,
			})
			.from(observationRatings)
			.innerJoin(
				observations,
				eq(observationRatings.observationId, observations.id)
			)
			.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(isNotNull(observationRatings.rating), ...conditions));
		return {
			avgRating: toFixed2(result?.avgRating),
			lecturerIds: (result?.lecturerIds ?? []).filter(Boolean),
		};
	}

	private async getSchoolComparison(
		filter: ReportFilter
	): Promise<SchoolComparisonItem[]> {
		const fbConditions = buildFeedbackConditions(filter);
		const obsConditions = buildObservationConditions(filter);

		const [fbRows, obsRows] = await Promise.all([
			db
				.select({
					schoolId: schools.id,
					schoolCode: schools.code,
					schoolName: schools.name,
					avgRating: avg(studentFeedbackResponses.rating),
				})
				.from(studentFeedbackResponses)
				.innerJoin(
					studentFeedbackPassphrases,
					eq(
						studentFeedbackResponses.passphraseId,
						studentFeedbackPassphrases.id
					)
				)
				.innerJoin(
					feedbackCycles,
					eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
				)
				.innerJoin(
					structureSemesters,
					eq(
						studentFeedbackPassphrases.structureSemesterId,
						structureSemesters.id
					)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.innerJoin(
					assignedModules,
					eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
				)
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.where(
					and(
						isNotNull(studentFeedbackResponses.rating),
						...(fbConditions.length > 0 ? fbConditions : [])
					)
				)
				.groupBy(schools.id, schools.code, schools.name),
			db
				.select({
					schoolId: schools.id,
					schoolCode: schools.code,
					schoolName: schools.name,
					avgRating: avg(observationRatings.rating),
				})
				.from(observationRatings)
				.innerJoin(
					observations,
					eq(observationRatings.observationId, observations.id)
				)
				.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
				.innerJoin(
					assignedModules,
					eq(observations.assignedModuleId, assignedModules.id)
				)
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.innerJoin(
					structureSemesters,
					eq(semesterModules.semesterId, structureSemesters.id)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.where(and(isNotNull(observationRatings.rating), ...obsConditions))
				.groupBy(schools.id, schools.code, schools.name),
		]);

		const schoolMap = new Map<number, SchoolComparisonItem>();
		for (const row of fbRows) {
			schoolMap.set(row.schoolId, {
				schoolId: row.schoolId,
				schoolCode: row.schoolCode,
				schoolName: row.schoolName,
				feedbackAvg: toFixed2(row.avgRating),
				observationAvg: 0,
			});
		}
		for (const row of obsRows) {
			const existing = schoolMap.get(row.schoolId);
			if (existing) {
				existing.observationAvg = toFixed2(row.avgRating);
			} else {
				schoolMap.set(row.schoolId, {
					schoolId: row.schoolId,
					schoolCode: row.schoolCode,
					schoolName: row.schoolName,
					feedbackAvg: 0,
					observationAvg: toFixed2(row.avgRating),
				});
			}
		}
		return Array.from(schoolMap.values());
	}

	private async getOverviewTrend(filter: ReportFilter): Promise<TrendPoint[]> {
		const fbConditions = buildFeedbackConditions(filter);
		const obsConditions = buildObservationConditions(filter);

		const [fbRows, obsRows] = await Promise.all([
			db
				.select({
					termId: feedbackCycles.termId,
					termCode: terms.code,
					avgRating: avg(studentFeedbackResponses.rating),
				})
				.from(studentFeedbackResponses)
				.innerJoin(
					studentFeedbackPassphrases,
					eq(
						studentFeedbackResponses.passphraseId,
						studentFeedbackPassphrases.id
					)
				)
				.innerJoin(
					feedbackCycles,
					eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
				)
				.innerJoin(terms, eq(feedbackCycles.termId, terms.id))
				.innerJoin(
					structureSemesters,
					eq(
						studentFeedbackPassphrases.structureSemesterId,
						structureSemesters.id
					)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.innerJoin(
					assignedModules,
					eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
				)
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.where(
					and(
						isNotNull(studentFeedbackResponses.rating),
						...(fbConditions.length > 0 ? fbConditions : [])
					)
				)
				.groupBy(feedbackCycles.termId, terms.code)
				.orderBy(feedbackCycles.termId),
			db
				.select({
					termId: feedbackCycles.termId,
					termCode: terms.code,
					avgRating: avg(observationRatings.rating),
				})
				.from(observationRatings)
				.innerJoin(
					observations,
					eq(observationRatings.observationId, observations.id)
				)
				.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
				.innerJoin(terms, eq(feedbackCycles.termId, terms.id))
				.innerJoin(
					assignedModules,
					eq(observations.assignedModuleId, assignedModules.id)
				)
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.innerJoin(
					structureSemesters,
					eq(semesterModules.semesterId, structureSemesters.id)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.where(and(isNotNull(observationRatings.rating), ...obsConditions))
				.groupBy(feedbackCycles.termId, terms.code)
				.orderBy(feedbackCycles.termId),
		]);

		const trendMap = new Map<number, TrendPoint>();
		for (const row of fbRows) {
			trendMap.set(row.termId, {
				termId: row.termId,
				termCode: row.termCode,
				feedbackAvg: toFixed2(row.avgRating),
				observationAvg: 0,
			});
		}
		for (const row of obsRows) {
			const existing = trendMap.get(row.termId);
			if (existing) {
				existing.observationAvg = toFixed2(row.avgRating);
			} else {
				trendMap.set(row.termId, {
					termId: row.termId,
					termCode: row.termCode,
					feedbackAvg: 0,
					observationAvg: toFixed2(row.avgRating),
				});
			}
		}
		return Array.from(trendMap.values()).sort((a, b) => a.termId - b.termId);
	}

	private async getFeedbackHeatmap(
		filter: ReportFilter
	): Promise<HeatmapCell[]> {
		const conditions = buildFeedbackConditions(filter);
		const rows = await db
			.select({
				schoolId: schools.id,
				schoolCode: schools.code,
				categoryId: studentFeedbackCategories.id,
				categoryName: studentFeedbackCategories.name,
				avgRating: avg(studentFeedbackResponses.rating),
			})
			.from(studentFeedbackResponses)
			.innerJoin(
				studentFeedbackQuestions,
				eq(studentFeedbackResponses.questionId, studentFeedbackQuestions.id)
			)
			.innerJoin(
				studentFeedbackCategories,
				eq(studentFeedbackQuestions.categoryId, studentFeedbackCategories.id)
			)
			.innerJoin(
				studentFeedbackPassphrases,
				eq(studentFeedbackResponses.passphraseId, studentFeedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(
					studentFeedbackPassphrases.structureSemesterId,
					structureSemesters.id
				)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				assignedModules,
				eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(
				and(
					isNotNull(studentFeedbackResponses.rating),
					...(conditions.length > 0 ? conditions : [])
				)
			)
			.groupBy(
				schools.id,
				schools.code,
				studentFeedbackCategories.id,
				studentFeedbackCategories.name
			);

		return rows.map((r) => ({
			schoolId: r.schoolId,
			schoolCode: r.schoolCode,
			categoryId: r.categoryId,
			categoryName: r.categoryName,
			avgRating: toFixed2(r.avgRating),
		}));
	}

	private async getObservationHeatmap(
		filter: ReportFilter
	): Promise<HeatmapCell[]> {
		const conditions = buildObservationConditions(filter);
		const rows = await db
			.select({
				schoolId: schools.id,
				schoolCode: schools.code,
				categoryId: observationCategories.id,
				categoryName: observationCategories.name,
				avgRating: avg(observationRatings.rating),
			})
			.from(observationRatings)
			.innerJoin(
				observationCriteria,
				eq(observationRatings.criterionId, observationCriteria.id)
			)
			.innerJoin(
				observationCategories,
				eq(observationCriteria.categoryId, observationCategories.id)
			)
			.innerJoin(
				observations,
				eq(observationRatings.observationId, observations.id)
			)
			.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(isNotNull(observationRatings.rating), ...conditions))
			.groupBy(
				schools.id,
				schools.code,
				observationCategories.id,
				observationCategories.name
			);

		return rows.map((r) => ({
			schoolId: r.schoolId,
			schoolCode: r.schoolCode,
			categoryId: r.categoryId,
			categoryName: r.categoryName,
			avgRating: toFixed2(r.avgRating),
		}));
	}

	private async getOverviewLecturerRankings(
		filter: ReportFilter
	): Promise<OverviewLecturerRanking[]> {
		const fbConditions = buildFeedbackConditions(filter);
		const obsConditions = buildObservationConditions(filter);

		const [fbRows, obsRows] = await Promise.all([
			db
				.select({
					userId: assignedModules.userId,
					lecturerName: users.name,
					schoolCode: schools.code,
					avgRating: avg(studentFeedbackResponses.rating),
				})
				.from(studentFeedbackResponses)
				.innerJoin(
					assignedModules,
					eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
				)
				.innerJoin(users, eq(assignedModules.userId, users.id))
				.innerJoin(
					studentFeedbackPassphrases,
					eq(
						studentFeedbackResponses.passphraseId,
						studentFeedbackPassphrases.id
					)
				)
				.innerJoin(
					feedbackCycles,
					eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
				)
				.innerJoin(
					structureSemesters,
					eq(
						studentFeedbackPassphrases.structureSemesterId,
						structureSemesters.id
					)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.where(
					and(
						isNotNull(studentFeedbackResponses.rating),
						...(fbConditions.length > 0 ? fbConditions : [])
					)
				)
				.groupBy(assignedModules.userId, users.name, schools.code),
			db
				.select({
					userId: assignedModules.userId,
					lecturerName: users.name,
					schoolCode: schools.code,
					avgRating: avg(observationRatings.rating),
				})
				.from(observationRatings)
				.innerJoin(
					observations,
					eq(observationRatings.observationId, observations.id)
				)
				.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
				.innerJoin(
					assignedModules,
					eq(observations.assignedModuleId, assignedModules.id)
				)
				.innerJoin(users, eq(assignedModules.userId, users.id))
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.innerJoin(
					structureSemesters,
					eq(semesterModules.semesterId, structureSemesters.id)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.where(and(isNotNull(observationRatings.rating), ...obsConditions))
				.groupBy(assignedModules.userId, users.name, schools.code),
		]);

		const lecturerMap = new Map<string, OverviewLecturerRanking>();
		for (const row of fbRows) {
			lecturerMap.set(row.userId, {
				userId: row.userId,
				lecturerName: row.lecturerName ?? 'Unknown',
				schoolCode: row.schoolCode,
				feedbackAvg: toFixed2(row.avgRating),
				observationAvg: 0,
				combinedAvg: 0,
			});
		}
		for (const row of obsRows) {
			const existing = lecturerMap.get(row.userId);
			if (existing) {
				existing.observationAvg = toFixed2(row.avgRating);
			} else {
				lecturerMap.set(row.userId, {
					userId: row.userId,
					lecturerName: row.lecturerName ?? 'Unknown',
					schoolCode: row.schoolCode,
					feedbackAvg: 0,
					observationAvg: toFixed2(row.avgRating),
					combinedAvg: 0,
				});
			}
		}
		for (const l of lecturerMap.values()) {
			const sources = [l.feedbackAvg, l.observationAvg].filter((v) => v > 0);
			l.combinedAvg =
				sources.length > 0
					? toFixed2(sources.reduce((a, b) => a + b, 0) / sources.length)
					: 0;
		}
		return Array.from(lecturerMap.values()).sort(
			(a, b) => b.combinedAvg - a.combinedAvg
		);
	}

	private async getFeedbackOverviewStats(
		filter: ReportFilter
	): Promise<FeedbackOverviewStats> {
		const conditions = buildFeedbackConditions(filter);

		const [responseStats] = await db
			.select({
				totalResponses: count(studentFeedbackResponses.id),
				avgRating: avg(studentFeedbackResponses.rating),
				lecturersEvaluated: countDistinct(assignedModules.userId),
			})
			.from(studentFeedbackResponses)
			.innerJoin(
				studentFeedbackPassphrases,
				eq(studentFeedbackResponses.passphraseId, studentFeedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(
					studentFeedbackPassphrases.structureSemesterId,
					structureSemesters.id
				)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				assignedModules,
				eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		const passphraseConditions = [];
		if (filter.termId) {
			passphraseConditions.push(eq(feedbackCycles.termId, filter.termId));
		}
		if (filter.cycleId) {
			passphraseConditions.push(
				eq(studentFeedbackPassphrases.cycleId, filter.cycleId)
			);
		}

		const [passphraseStats] = await db
			.select({
				total: count(studentFeedbackPassphrases.id),
				used: sql<number>`count(*) filter (where ${studentFeedbackPassphrases.used} = true)`,
			})
			.from(studentFeedbackPassphrases)
			.innerJoin(
				feedbackCycles,
				eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.where(
				passphraseConditions.length > 0
					? and(...passphraseConditions)
					: undefined
			);

		const total = passphraseStats?.total ?? 0;
		const used = passphraseStats?.used ?? 0;

		return {
			totalResponses: responseStats?.totalResponses ?? 0,
			avgRating: toFixed2(responseStats?.avgRating),
			responseRate: total > 0 ? Math.round((used / total) * 100) : 0,
			lecturersEvaluated: responseStats?.lecturersEvaluated ?? 0,
		};
	}

	private async getFeedbackCategoryAverages(
		filter: ReportFilter
	): Promise<CategoryAverage[]> {
		const conditions = buildFeedbackConditions(filter);
		const results = await db
			.select({
				categoryId: studentFeedbackCategories.id,
				categoryName: studentFeedbackCategories.name,
				avgRating: avg(studentFeedbackResponses.rating),
				responseCount: count(studentFeedbackResponses.id),
				sortOrder: studentFeedbackCategories.sortOrder,
			})
			.from(studentFeedbackResponses)
			.innerJoin(
				studentFeedbackQuestions,
				eq(studentFeedbackResponses.questionId, studentFeedbackQuestions.id)
			)
			.innerJoin(
				studentFeedbackCategories,
				eq(studentFeedbackQuestions.categoryId, studentFeedbackCategories.id)
			)
			.innerJoin(
				studentFeedbackPassphrases,
				eq(studentFeedbackResponses.passphraseId, studentFeedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(
					studentFeedbackPassphrases.structureSemesterId,
					structureSemesters.id
				)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				assignedModules,
				eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(
				and(
					isNotNull(studentFeedbackResponses.rating),
					...(conditions.length > 0 ? conditions : [])
				)
			)
			.groupBy(
				studentFeedbackCategories.id,
				studentFeedbackCategories.name,
				studentFeedbackCategories.sortOrder
			)
			.orderBy(studentFeedbackCategories.sortOrder);

		return results.map((r) => ({
			categoryId: r.categoryId,
			categoryName: r.categoryName,
			avgRating: toFixed2(r.avgRating),
			responseCount: r.responseCount,
			sortOrder: r.sortOrder,
		}));
	}

	private async getFeedbackTrendData(
		filter: ReportFilter
	): Promise<FeedbackTrendPoint[]> {
		const conditions = buildFeedbackConditions(filter);
		const results = await db
			.select({
				termId: feedbackCycles.termId,
				termCode: terms.code,
				avgRating: avg(studentFeedbackResponses.rating),
				responseCount: count(studentFeedbackResponses.id),
			})
			.from(studentFeedbackResponses)
			.innerJoin(
				studentFeedbackPassphrases,
				eq(studentFeedbackResponses.passphraseId, studentFeedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(terms, eq(feedbackCycles.termId, terms.id))
			.innerJoin(
				structureSemesters,
				eq(
					studentFeedbackPassphrases.structureSemesterId,
					structureSemesters.id
				)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				assignedModules,
				eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(
				and(
					isNotNull(studentFeedbackResponses.rating),
					...(conditions.length > 0 ? conditions : [])
				)
			)
			.groupBy(feedbackCycles.termId, terms.code)
			.orderBy(feedbackCycles.termId);

		return results.map((r) => ({
			termId: r.termId,
			termCode: r.termCode,
			avgRating: toFixed2(r.avgRating),
			responseCount: r.responseCount,
		}));
	}

	private async getFeedbackLecturerRankings(
		filter: ReportFilter
	): Promise<FeedbackLecturerRanking[]> {
		const conditions = buildFeedbackConditions(filter);

		const [lecturerRows, moduleCountRows] = await Promise.all([
			db
				.select({
					userId: assignedModules.userId,
					lecturerName: users.name,
					schoolCode: schools.code,
					schoolName: schools.name,
					categoryName: studentFeedbackCategories.name,
					avgRating: avg(studentFeedbackResponses.rating),
					responseCount: count(studentFeedbackResponses.id),
				})
				.from(studentFeedbackResponses)
				.innerJoin(
					studentFeedbackQuestions,
					eq(studentFeedbackResponses.questionId, studentFeedbackQuestions.id)
				)
				.innerJoin(
					studentFeedbackCategories,
					eq(studentFeedbackQuestions.categoryId, studentFeedbackCategories.id)
				)
				.innerJoin(
					studentFeedbackPassphrases,
					eq(
						studentFeedbackResponses.passphraseId,
						studentFeedbackPassphrases.id
					)
				)
				.innerJoin(
					feedbackCycles,
					eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
				)
				.innerJoin(
					structureSemesters,
					eq(
						studentFeedbackPassphrases.structureSemesterId,
						structureSemesters.id
					)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.innerJoin(
					assignedModules,
					eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
				)
				.innerJoin(users, eq(assignedModules.userId, users.id))
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.where(
					and(
						isNotNull(studentFeedbackResponses.rating),
						...(conditions.length > 0 ? conditions : [])
					)
				)
				.groupBy(
					assignedModules.userId,
					users.name,
					schools.code,
					schools.name,
					studentFeedbackCategories.name
				),
			db
				.select({
					userId: assignedModules.userId,
					moduleCount: countDistinct(assignedModules.semesterModuleId),
				})
				.from(studentFeedbackResponses)
				.innerJoin(
					assignedModules,
					eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
				)
				.innerJoin(
					studentFeedbackPassphrases,
					eq(
						studentFeedbackResponses.passphraseId,
						studentFeedbackPassphrases.id
					)
				)
				.innerJoin(
					feedbackCycles,
					eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
				)
				.innerJoin(
					structureSemesters,
					eq(
						studentFeedbackPassphrases.structureSemesterId,
						structureSemesters.id
					)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.groupBy(assignedModules.userId),
		]);

		const moduleCountMap = new Map<string, number>();
		for (const row of moduleCountRows) {
			moduleCountMap.set(row.userId, row.moduleCount);
		}

		const lecturerMap = new Map<string, FeedbackLecturerRanking>();
		for (const row of lecturerRows) {
			if (!lecturerMap.has(row.userId)) {
				lecturerMap.set(row.userId, {
					userId: row.userId,
					lecturerName: row.lecturerName ?? 'Unknown',
					schoolCode: row.schoolCode,
					schoolName: row.schoolName,
					moduleCount: moduleCountMap.get(row.userId) ?? 0,
					responseCount: 0,
					avgRating: 0,
					categoryAverages: {},
				});
			}
			const lecturer = lecturerMap.get(row.userId)!;
			lecturer.responseCount += row.responseCount;
			lecturer.categoryAverages[row.categoryName] = toFixed2(row.avgRating);
		}

		for (const lecturer of lecturerMap.values()) {
			const catValues = Object.values(lecturer.categoryAverages);
			if (catValues.length > 0) {
				lecturer.avgRating = toFixed2(
					catValues.reduce((a, b) => a + b, 0) / catValues.length
				);
			}
		}

		return Array.from(lecturerMap.values()).sort(
			(a, b) => b.avgRating - a.avgRating
		);
	}

	private async getObservationOverviewStats(
		filter: ReportFilter
	): Promise<ObservationOverviewStats> {
		const conditions = buildObservationConditions(filter);

		const [stats] = await db
			.select({
				totalObservations: count(observations.id),
				lecturersEvaluated: countDistinct(assignedModules.userId),
				acknowledged: sql<number>`count(*) filter (where ${observations.status} = 'acknowledged')`,
			})
			.from(observations)
			.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...conditions));

		const [ratingStats] = await db
			.select({ avgScore: avg(observationRatings.rating) })
			.from(observationRatings)
			.innerJoin(
				observations,
				eq(observationRatings.observationId, observations.id)
			)
			.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(isNotNull(observationRatings.rating), ...conditions));

		const total = stats?.totalObservations ?? 0;
		const ack = stats?.acknowledged ?? 0;

		return {
			totalObservations: total,
			avgScore: toFixed2(ratingStats?.avgScore),
			lecturersEvaluated: stats?.lecturersEvaluated ?? 0,
			acknowledgmentRate: total > 0 ? Math.round((ack / total) * 100) : 0,
		};
	}

	private async getObservationCategoryAverages(
		filter: ReportFilter
	): Promise<ObservationCategoryAverage[]> {
		const conditions = buildObservationConditions(filter);
		const results = await db
			.select({
				categoryId: observationCategories.id,
				categoryName: observationCategories.name,
				section: observationCategories.section,
				avgRating: avg(observationRatings.rating),
				ratingCount: count(observationRatings.id),
				sortOrder: observationCategories.sortOrder,
			})
			.from(observationRatings)
			.innerJoin(
				observationCriteria,
				eq(observationRatings.criterionId, observationCriteria.id)
			)
			.innerJoin(
				observationCategories,
				eq(observationCriteria.categoryId, observationCategories.id)
			)
			.innerJoin(
				observations,
				eq(observationRatings.observationId, observations.id)
			)
			.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(isNotNull(observationRatings.rating), ...conditions))
			.groupBy(
				observationCategories.id,
				observationCategories.name,
				observationCategories.section,
				observationCategories.sortOrder
			)
			.orderBy(observationCategories.section, observationCategories.sortOrder);

		return results.map((r) => ({
			categoryId: r.categoryId,
			categoryName: r.categoryName,
			section: r.section,
			avgRating: toFixed2(r.avgRating),
			ratingCount: r.ratingCount,
			sortOrder: r.sortOrder,
		}));
	}

	private async getObservationTrendData(
		filter: ReportFilter
	): Promise<ObservationTrendPoint[]> {
		const conditions = buildObservationConditions(filter);
		const results = await db
			.select({
				termId: feedbackCycles.termId,
				termCode: terms.code,
				avgScore: avg(observationRatings.rating),
				observationCount: countDistinct(observations.id),
			})
			.from(observationRatings)
			.innerJoin(
				observations,
				eq(observationRatings.observationId, observations.id)
			)
			.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
			.innerJoin(terms, eq(feedbackCycles.termId, terms.id))
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(isNotNull(observationRatings.rating), ...conditions))
			.groupBy(feedbackCycles.termId, terms.code)
			.orderBy(feedbackCycles.termId);

		return results.map((r) => ({
			termId: r.termId,
			termCode: r.termCode,
			avgScore: toFixed2(r.avgScore),
			observationCount: r.observationCount,
		}));
	}

	private async getObservationLecturerRankings(
		filter: ReportFilter
	): Promise<ObservationLecturerRanking[]> {
		const conditions = buildObservationConditions(filter);

		const [rows, obsCountRows] = await Promise.all([
			db
				.select({
					userId: assignedModules.userId,
					lecturerName: users.name,
					schoolCode: schools.code,
					schoolName: schools.name,
					categoryName: observationCategories.name,
					avgRating: avg(observationRatings.rating),
				})
				.from(observationRatings)
				.innerJoin(
					observations,
					eq(observationRatings.observationId, observations.id)
				)
				.innerJoin(
					observationCriteria,
					eq(observationRatings.criterionId, observationCriteria.id)
				)
				.innerJoin(
					observationCategories,
					eq(observationCriteria.categoryId, observationCategories.id)
				)
				.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
				.innerJoin(
					assignedModules,
					eq(observations.assignedModuleId, assignedModules.id)
				)
				.innerJoin(users, eq(assignedModules.userId, users.id))
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.innerJoin(
					structureSemesters,
					eq(semesterModules.semesterId, structureSemesters.id)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.where(and(isNotNull(observationRatings.rating), ...conditions))
				.groupBy(
					assignedModules.userId,
					users.name,
					schools.code,
					schools.name,
					observationCategories.name
				),
			db
				.select({
					userId: assignedModules.userId,
					obsCount: count(observations.id),
				})
				.from(observations)
				.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
				.innerJoin(
					assignedModules,
					eq(observations.assignedModuleId, assignedModules.id)
				)
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.innerJoin(
					structureSemesters,
					eq(semesterModules.semesterId, structureSemesters.id)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.where(and(...conditions))
				.groupBy(assignedModules.userId),
		]);

		const obsCountMap = new Map<string, number>();
		for (const row of obsCountRows) {
			obsCountMap.set(row.userId, row.obsCount);
		}

		const lecturerMap = new Map<string, ObservationLecturerRanking>();
		for (const row of rows) {
			if (!lecturerMap.has(row.userId)) {
				lecturerMap.set(row.userId, {
					userId: row.userId,
					lecturerName: row.lecturerName ?? 'Unknown',
					schoolCode: row.schoolCode,
					schoolName: row.schoolName,
					observationCount: obsCountMap.get(row.userId) ?? 0,
					avgScore: 0,
					categoryAverages: {},
				});
			}
			const lecturer = lecturerMap.get(row.userId)!;
			lecturer.categoryAverages[row.categoryName] = toFixed2(row.avgRating);
		}

		for (const lecturer of lecturerMap.values()) {
			const catValues = Object.values(lecturer.categoryAverages);
			if (catValues.length > 0) {
				lecturer.avgScore = toFixed2(
					catValues.reduce((s, v) => s + v, 0) / catValues.length
				);
			}
		}

		return Array.from(lecturerMap.values()).sort(
			(a, b) => b.avgScore - a.avgScore
		);
	}

	private async getCriteriaBreakdown(
		filter: ReportFilter
	): Promise<CriterionBreakdownItem[]> {
		const conditions = buildObservationConditions(filter);
		const results = await db
			.select({
				criterionId: observationCriteria.id,
				criterionText: observationCriteria.text,
				categoryId: observationCategories.id,
				categoryName: observationCategories.name,
				section: observationCategories.section,
				avgRating: avg(observationRatings.rating),
				ratingCount: count(observationRatings.id),
			})
			.from(observationRatings)
			.innerJoin(
				observationCriteria,
				eq(observationRatings.criterionId, observationCriteria.id)
			)
			.innerJoin(
				observationCategories,
				eq(observationCriteria.categoryId, observationCategories.id)
			)
			.innerJoin(
				observations,
				eq(observationRatings.observationId, observations.id)
			)
			.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(isNotNull(observationRatings.rating), ...conditions))
			.groupBy(
				observationCriteria.id,
				observationCriteria.text,
				observationCategories.id,
				observationCategories.name,
				observationCategories.section
			)
			.orderBy(
				observationCategories.section,
				observationCategories.sortOrder,
				observationCriteria.sortOrder
			);

		return results.map((r) => ({
			criterionId: r.criterionId,
			criterionText: r.criterionText,
			categoryId: r.categoryId,
			categoryName: r.categoryName,
			section: r.section,
			avgRating: toFixed2(r.avgRating),
			ratingCount: r.ratingCount,
		}));
	}

	private async getLecturerModules(
		_userId: string,
		allConditions: ReturnType<typeof and>[]
	): Promise<LecturerModuleBreakdown[]> {
		const moduleRows = await db
			.select({
				moduleCode: modules.code,
				moduleName: modules.name,
				avgRating: avg(studentFeedbackResponses.rating),
				responseCount: count(studentFeedbackResponses.id),
				programCode: programs.code,
				semesterNumber: structureSemesters.semesterNumber,
			})
			.from(studentFeedbackResponses)
			.innerJoin(
				assignedModules,
				eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				studentFeedbackPassphrases,
				eq(studentFeedbackResponses.passphraseId, studentFeedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(
					studentFeedbackPassphrases.structureSemesterId,
					structureSemesters.id
				)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...allConditions))
			.groupBy(
				modules.code,
				modules.name,
				programs.code,
				structureSemesters.semesterNumber
			);

		return moduleRows.map((r) => {
			const year = Math.ceil(Number(r.semesterNumber) / 2);
			const sem = Number(r.semesterNumber) % 2 === 0 ? 2 : 1;
			return {
				moduleCode: r.moduleCode,
				moduleName: r.moduleName,
				avgRating: toFixed2(r.avgRating),
				responseCount: r.responseCount,
				className: `${r.programCode}Y${year}S${sem}`,
			};
		});
	}

	private async getLecturerQuestions(
		_userId: string,
		allConditions: ReturnType<typeof and>[],
		filter: ReportFilter
	): Promise<LecturerQuestionDetail[]> {
		const overallBreakdown = await this.getQuestionBreakdown(filter);
		const overallAvgMap = new Map<string, number>();
		for (const q of overallBreakdown) {
			overallAvgMap.set(q.questionId, q.avgRating);
		}

		const questionRows = await db
			.select({
				questionId: studentFeedbackQuestions.id,
				questionText: studentFeedbackQuestions.text,
				categoryName: studentFeedbackCategories.name,
				rating: studentFeedbackResponses.rating,
				count: count(studentFeedbackResponses.id),
			})
			.from(studentFeedbackResponses)
			.innerJoin(
				studentFeedbackQuestions,
				eq(studentFeedbackResponses.questionId, studentFeedbackQuestions.id)
			)
			.innerJoin(
				studentFeedbackCategories,
				eq(studentFeedbackQuestions.categoryId, studentFeedbackCategories.id)
			)
			.innerJoin(
				assignedModules,
				eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				studentFeedbackPassphrases,
				eq(studentFeedbackResponses.passphraseId, studentFeedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(
					studentFeedbackPassphrases.structureSemesterId,
					structureSemesters.id
				)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(and(...allConditions))
			.groupBy(
				studentFeedbackQuestions.id,
				studentFeedbackQuestions.text,
				studentFeedbackCategories.name,
				studentFeedbackResponses.rating
			);

		const qMap = new Map<string, LecturerQuestionDetail>();
		for (const row of questionRows) {
			if (!qMap.has(row.questionId)) {
				qMap.set(row.questionId, {
					questionId: row.questionId,
					questionText: row.questionText,
					categoryName: row.categoryName,
					avgRating: 0,
					overallAvgRating: overallAvgMap.get(row.questionId) ?? 0,
					responseCount: 0,
					distribution: [1, 2, 3, 4, 5].map((r) => ({
						rating: r,
						count: 0,
						percentage: 0,
					})),
				});
			}
			const q = qMap.get(row.questionId)!;
			if (row.rating !== null) {
				const d = q.distribution.find((d) => d.rating === row.rating);
				if (d) d.count = row.count;
			}
		}

		for (const q of qMap.values()) {
			const totalCount = q.distribution.reduce((sum, d) => sum + d.count, 0);
			q.responseCount = totalCount;
			if (totalCount > 0) {
				const weightedSum = q.distribution.reduce(
					(sum, d) => sum + d.rating * d.count,
					0
				);
				q.avgRating = toFixed2(weightedSum / totalCount);
				for (const d of q.distribution) {
					d.percentage = Math.round((d.count / totalCount) * 100);
				}
			}
		}

		return Array.from(qMap.values());
	}

	private async getQuestionBreakdown(filter: ReportFilter) {
		const conditions = buildFeedbackConditions(filter);
		const results = await db
			.select({
				questionId: studentFeedbackQuestions.id,
				rating: studentFeedbackResponses.rating,
				count: count(studentFeedbackResponses.id),
			})
			.from(studentFeedbackResponses)
			.innerJoin(
				studentFeedbackQuestions,
				eq(studentFeedbackResponses.questionId, studentFeedbackQuestions.id)
			)
			.innerJoin(
				studentFeedbackPassphrases,
				eq(studentFeedbackResponses.passphraseId, studentFeedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(
					studentFeedbackPassphrases.structureSemesterId,
					structureSemesters.id
				)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				assignedModules,
				eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(
				and(
					isNotNull(studentFeedbackResponses.rating),
					...(conditions.length > 0 ? conditions : [])
				)
			)
			.groupBy(studentFeedbackQuestions.id, studentFeedbackResponses.rating);

		const qMap = new Map<string, { questionId: string; avgRating: number }>();
		const rawMap = new Map<string, { rating: number; count: number }[]>();

		for (const row of results) {
			if (!rawMap.has(row.questionId)) {
				rawMap.set(row.questionId, []);
			}
			if (row.rating !== null) {
				rawMap.get(row.questionId)!.push({
					rating: row.rating,
					count: row.count,
				});
			}
		}

		for (const [questionId, dist] of rawMap) {
			const totalCount = dist.reduce((sum, d) => sum + d.count, 0);
			const weightedSum = dist.reduce((sum, d) => sum + d.rating * d.count, 0);
			qMap.set(questionId, {
				questionId,
				avgRating: totalCount > 0 ? toFixed2(weightedSum / totalCount) : 0,
			});
		}

		return Array.from(qMap.values());
	}

	private async getLecturerComments(
		userId: string,
		conditions: ReturnType<typeof buildFeedbackConditions>
	): Promise<LecturerComment[]> {
		const commentConditions = [
			eq(assignedModules.userId, userId),
			isNotNull(studentFeedbackResponses.comment),
			...conditions,
		];

		const commentRows = await db
			.select({
				moduleCode: modules.code,
				moduleName: modules.name,
				programCode: programs.code,
				semesterNumber: structureSemesters.semesterNumber,
				comment: studentFeedbackResponses.comment,
			})
			.from(studentFeedbackResponses)
			.innerJoin(
				assignedModules,
				eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				studentFeedbackPassphrases,
				eq(studentFeedbackResponses.passphraseId, studentFeedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(
					studentFeedbackPassphrases.structureSemesterId,
					structureSemesters.id
				)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...commentConditions));

		return commentRows
			.filter((r) => r.comment && r.comment.trim().length > 0)
			.map((r) => {
				const year = Math.ceil(Number(r.semesterNumber) / 2);
				const sem = Number(r.semesterNumber) % 2 === 0 ? 2 : 1;
				return {
					moduleCode: r.moduleCode,
					moduleName: r.moduleName,
					className: `${r.programCode}Y${year}S${sem}`,
					comment: r.comment!,
				};
			});
	}

	private async getRadarData(
		userId: string,
		filter: ReportFilter
	): Promise<RadarDataPoint[]> {
		const fbConditions = buildFeedbackConditions(filter);
		const obsConditions = buildObservationConditions(filter);

		const [fbRows, obsRows] = await Promise.all([
			db
				.select({
					categoryName: studentFeedbackCategories.name,
					avgRating: avg(studentFeedbackResponses.rating),
				})
				.from(studentFeedbackResponses)
				.innerJoin(
					studentFeedbackQuestions,
					eq(studentFeedbackResponses.questionId, studentFeedbackQuestions.id)
				)
				.innerJoin(
					studentFeedbackCategories,
					eq(studentFeedbackQuestions.categoryId, studentFeedbackCategories.id)
				)
				.innerJoin(
					assignedModules,
					eq(studentFeedbackResponses.assignedModuleId, assignedModules.id)
				)
				.innerJoin(
					studentFeedbackPassphrases,
					eq(
						studentFeedbackResponses.passphraseId,
						studentFeedbackPassphrases.id
					)
				)
				.innerJoin(
					feedbackCycles,
					eq(studentFeedbackPassphrases.cycleId, feedbackCycles.id)
				)
				.innerJoin(
					structureSemesters,
					eq(
						studentFeedbackPassphrases.structureSemesterId,
						structureSemesters.id
					)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.where(
					and(
						eq(assignedModules.userId, userId),
						isNotNull(studentFeedbackResponses.rating),
						...(fbConditions.length > 0 ? fbConditions : [])
					)
				)
				.groupBy(studentFeedbackCategories.name),
			db
				.select({
					categoryName: observationCategories.name,
					avgRating: avg(observationRatings.rating),
				})
				.from(observationRatings)
				.innerJoin(
					observationCriteria,
					eq(observationRatings.criterionId, observationCriteria.id)
				)
				.innerJoin(
					observationCategories,
					eq(observationCriteria.categoryId, observationCategories.id)
				)
				.innerJoin(
					observations,
					eq(observationRatings.observationId, observations.id)
				)
				.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
				.innerJoin(
					assignedModules,
					eq(observations.assignedModuleId, assignedModules.id)
				)
				.innerJoin(
					semesterModules,
					eq(assignedModules.semesterModuleId, semesterModules.id)
				)
				.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
				.innerJoin(
					structureSemesters,
					eq(semesterModules.semesterId, structureSemesters.id)
				)
				.innerJoin(
					structures,
					eq(structureSemesters.structureId, structures.id)
				)
				.innerJoin(programs, eq(structures.programId, programs.id))
				.innerJoin(schools, eq(programs.schoolId, schools.id))
				.where(
					and(
						eq(assignedModules.userId, userId),
						isNotNull(observationRatings.rating),
						...obsConditions
					)
				)
				.groupBy(observationCategories.name),
		]);

		const radarMap = new Map<string, RadarDataPoint>();
		for (const row of fbRows) {
			radarMap.set(row.categoryName, {
				category: row.categoryName,
				feedbackScore: toFixed2(row.avgRating),
				observationScore: 0,
			});
		}
		for (const row of obsRows) {
			const existing = radarMap.get(row.categoryName);
			if (existing) {
				existing.observationScore = toFixed2(row.avgRating);
			} else {
				radarMap.set(row.categoryName, {
					category: row.categoryName,
					feedbackScore: 0,
					observationScore: toFixed2(row.avgRating),
				});
			}
		}
		return Array.from(radarMap.values());
	}

	private async getObservationsForLecturer(
		_userId: string,
		allConditions: ReturnType<typeof and>[]
	): Promise<ObservationDetail[]> {
		const obsRows = await db
			.select({
				observationId: observations.id,
				moduleName: modules.name,
				moduleCode: modules.code,
				cycleName: feedbackCycles.name,
				status: observations.status,
				strengths: observations.strengths,
				improvements: observations.improvements,
				recommendations: observations.recommendations,
				trainingArea: observations.trainingArea,
			})
			.from(observations)
			.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...allConditions));

		const obsIds = obsRows.map((o) => o.observationId);
		if (obsIds.length === 0) return [];

		const ratingRows = await db
			.select({
				observationId: observationRatings.observationId,
				avgScore: avg(observationRatings.rating),
			})
			.from(observationRatings)
			.where(
				and(
					inArray(observationRatings.observationId, obsIds),
					isNotNull(observationRatings.rating)
				)
			)
			.groupBy(observationRatings.observationId);

		const scoreMap = new Map<string, number>();
		for (const row of ratingRows) {
			scoreMap.set(row.observationId, toFixed2(row.avgScore));
		}

		return obsRows.map((o) => ({
			observationId: o.observationId,
			moduleName: o.moduleName,
			moduleCode: o.moduleCode,
			cycleName: o.cycleName,
			avgScore: scoreMap.get(o.observationId) ?? 0,
			status: o.status,
			strengths: o.strengths,
			improvements: o.improvements,
			recommendations: o.recommendations,
			trainingArea: o.trainingArea,
		}));
	}

	private async getCriteriaScoresForLecturer(
		_userId: string,
		allConditions: ReturnType<typeof and>[]
	): Promise<CriteriaScore[]> {
		const rows = await db
			.select({
				criterionId: observationCriteria.id,
				criterionText: observationCriteria.text,
				categoryName: observationCategories.name,
				section: observationCategories.section,
				avgRating: avg(observationRatings.rating),
			})
			.from(observationRatings)
			.innerJoin(
				observationCriteria,
				eq(observationRatings.criterionId, observationCriteria.id)
			)
			.innerJoin(
				observationCategories,
				eq(observationCriteria.categoryId, observationCategories.id)
			)
			.innerJoin(
				observations,
				eq(observationRatings.observationId, observations.id)
			)
			.innerJoin(feedbackCycles, eq(observations.cycleId, feedbackCycles.id))
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(isNotNull(observationRatings.rating), ...allConditions))
			.groupBy(
				observationCriteria.id,
				observationCriteria.text,
				observationCategories.name,
				observationCategories.section
			);

		return rows.map((r) => ({
			criterionId: r.criterionId,
			criterionText: r.criterionText,
			categoryName: r.categoryName,
			section: r.section,
			avgRating: toFixed2(r.avgRating),
		}));
	}

	private async getFeedbackCrossRef(
		userId: string,
		filter: ReportFilter
	): Promise<ObservationLecturerDetail['feedbackCrossRef']> {
		const conditions = buildFeedbackConditions(filter);
		const allConditions = [
			eq(assignedModules.userId, userId),
			isNotNull(studentFeedbackResponses.rating),
			...conditions,
		];

		const [mods, questions, comments] = await Promise.all([
			this.getLecturerModules(userId, allConditions),
			this.getLecturerQuestions(userId, allConditions, filter),
			this.getLecturerComments(userId, conditions),
		]);

		return { modules: mods, questions, comments };
	}
}

export const appraisalReportRepository = new AppraisalReportRepository();
