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
	terms,
	users,
} from '@/core/database';
import type {
	CycleOption,
	ObservationCategoryAverage,
	ObservationCriterionBreakdown,
	ObservationLecturerRanking,
	ObservationOverviewStats,
	ObservationReportFilter,
	ObservationTrendPoint,
} from '../_lib/types';

function buildFilterConditions(filter: ObservationReportFilter) {
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

class ObservationReportRepository {
	async getOverviewStats(
		filter: ObservationReportFilter
	): Promise<ObservationOverviewStats> {
		const conditions = buildFilterConditions(filter);

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
			.select({
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
			avgScore: Number.parseFloat(
				(Number(ratingStats?.avgScore) || 0).toFixed(2)
			),
			lecturersEvaluated: stats?.lecturersEvaluated ?? 0,
			acknowledgmentRate: total > 0 ? Math.round((ack / total) * 100) : 0,
		};
	}

	async getCategoryAverages(
		filter: ObservationReportFilter
	): Promise<ObservationCategoryAverage[]> {
		const conditions = buildFilterConditions(filter);

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
			avgRating: Number.parseFloat((Number(r.avgRating) || 0).toFixed(2)),
			ratingCount: r.ratingCount,
			sortOrder: r.sortOrder,
		}));
	}

	async getLecturerRankings(
		filter: ObservationReportFilter
	): Promise<ObservationLecturerRanking[]> {
		const conditions = buildFilterConditions(filter);

		const rows = await db
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
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(isNotNull(observationRatings.rating), ...conditions))
			.groupBy(
				assignedModules.userId,
				users.name,
				schools.code,
				schools.name,
				observationCategories.name
			);

		const obsCountRows = await db
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
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...conditions))
			.groupBy(assignedModules.userId);

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
			lecturer.categoryAverages[row.categoryName] = Number.parseFloat(
				(Number(row.avgRating) || 0).toFixed(2)
			);
		}

		for (const lecturer of lecturerMap.values()) {
			const catValues = Object.values(lecturer.categoryAverages);
			if (catValues.length > 0) {
				lecturer.avgScore = Number.parseFloat(
					(catValues.reduce((s, v) => s + v, 0) / catValues.length).toFixed(2)
				);
			}
		}

		return Array.from(lecturerMap.values()).sort(
			(a, b) => b.avgScore - a.avgScore
		);
	}

	async getTrendData(
		filter: ObservationReportFilter
	): Promise<ObservationTrendPoint[]> {
		const conditions = [
			inArray(observations.status, ['submitted', 'acknowledged']),
		];
		if (filter.schoolIds && filter.schoolIds.length > 0) {
			conditions.push(inArray(schools.id, filter.schoolIds));
		}
		if (filter.lecturerId) {
			conditions.push(eq(assignedModules.userId, filter.lecturerId));
		}

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
			avgScore: Number.parseFloat((Number(r.avgScore) || 0).toFixed(2)),
			observationCount: r.observationCount,
		}));
	}

	async getCriteriaBreakdown(
		filter: ObservationReportFilter
	): Promise<ObservationCriterionBreakdown[]> {
		const conditions = buildFilterConditions(filter);

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
			avgRating: Number.parseFloat((Number(r.avgRating) || 0).toFixed(2)),
			ratingCount: r.ratingCount,
		}));
	}

	async getCyclesByTerm(termId: number): Promise<CycleOption[]> {
		return db
			.select({
				id: feedbackCycles.id,
				name: feedbackCycles.name,
			})
			.from(feedbackCycles)
			.where(eq(feedbackCycles.termId, termId))
			.orderBy(feedbackCycles.name);
	}

	async getDetailedExportData(filter: ObservationReportFilter) {
		const conditions = buildFilterConditions(filter);

		return db
			.select({
				observationId: observations.id,
				status: observations.status,
				lecturerName: users.name,
				schoolCode: schools.code,
				schoolName: schools.name,
				programCode: programs.code,
				moduleCode: modules.code,
				moduleName: modules.name,
				cycleName: feedbackCycles.name,
				observerName: sql<string>`observer.name`,
				categoryName: observationCategories.name,
				section: observationCategories.section,
				criterionText: observationCriteria.text,
				rating: observationRatings.rating,
				strengths: observations.strengths,
				improvements: observations.improvements,
				recommendations: observations.recommendations,
				trainingArea: observations.trainingArea,
				submittedAt: observations.submittedAt,
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
				sql`"user" as observer`,
				sql`observer.id = ${observations.observerId}`
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
			.orderBy(users.name, observations.id, observationCategories.sortOrder);
	}
}

export const observationReportRepository = new ObservationReportRepository();
