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
	feedbackCategories,
	feedbackCycles,
	feedbackPassphrases,
	feedbackQuestions,
	feedbackResponses,
	modules,
	programs,
	schools,
	semesterModules,
	structureSemesters,
	structures,
	users,
} from '@/core/database';
import type {
	CategoryAverage,
	FeedbackReportFilter,
	LecturerComment,
	LecturerDetail,
	LecturerModuleBreakdown,
	LecturerQuestionDetail,
	LecturerRanking,
	OverviewStats,
	QuestionBreakdownItem,
	RatingDistribution,
} from '../_lib/types';

function buildFilterConditions(filter: FeedbackReportFilter) {
	const conditions = [];

	if (filter.termId) {
		conditions.push(eq(feedbackCycles.termId, filter.termId));
	}
	if (filter.cycleId) {
		conditions.push(eq(feedbackPassphrases.cycleId, filter.cycleId));
	}
	if (filter.schoolIds && filter.schoolIds.length > 0) {
		conditions.push(inArray(schools.id, filter.schoolIds));
	}
	if (filter.programId) {
		conditions.push(eq(programs.id, filter.programId));
	}
	if (filter.moduleId) {
		conditions.push(eq(modules.id, filter.moduleId));
	}

	return conditions;
}

export class FeedbackReportRepository {
	async getOverviewStats(filter: FeedbackReportFilter): Promise<OverviewStats> {
		const conditions = buildFilterConditions(filter);

		const [responseStats] = await db
			.select({
				totalResponses: count(feedbackResponses.id),
				avgRating: avg(feedbackResponses.rating),
				lecturersEvaluated: countDistinct(assignedModules.userId),
			})
			.from(feedbackResponses)
			.innerJoin(
				feedbackPassphrases,
				eq(feedbackResponses.passphraseId, feedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(feedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(feedbackPassphrases.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				assignedModules,
				eq(feedbackResponses.assignedModuleId, assignedModules.id)
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
				eq(feedbackPassphrases.cycleId, filter.cycleId)
			);
		}

		const [passphraseStats] = await db
			.select({
				total: count(feedbackPassphrases.id),
				used: sql<number>`count(*) filter (where ${feedbackPassphrases.used} = true)`,
			})
			.from(feedbackPassphrases)
			.innerJoin(
				feedbackCycles,
				eq(feedbackPassphrases.cycleId, feedbackCycles.id)
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
			avgRating: Number.parseFloat(
				(Number(responseStats?.avgRating) || 0).toFixed(2)
			),
			responseRate: total > 0 ? Math.round((used / total) * 100) : 0,
			lecturersEvaluated: responseStats?.lecturersEvaluated ?? 0,
		};
	}

	async getCategoryAverages(
		filter: FeedbackReportFilter
	): Promise<CategoryAverage[]> {
		const conditions = buildFilterConditions(filter);

		const results = await db
			.select({
				categoryId: feedbackCategories.id,
				categoryName: feedbackCategories.name,
				avgRating: avg(feedbackResponses.rating),
				responseCount: count(feedbackResponses.id),
				sortOrder: feedbackCategories.sortOrder,
			})
			.from(feedbackResponses)
			.innerJoin(
				feedbackQuestions,
				eq(feedbackResponses.questionId, feedbackQuestions.id)
			)
			.innerJoin(
				feedbackCategories,
				eq(feedbackQuestions.categoryId, feedbackCategories.id)
			)
			.innerJoin(
				feedbackPassphrases,
				eq(feedbackResponses.passphraseId, feedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(feedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(feedbackPassphrases.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				assignedModules,
				eq(feedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(
				and(
					isNotNull(feedbackResponses.rating),
					...(conditions.length > 0 ? conditions : [])
				)
			)
			.groupBy(
				feedbackCategories.id,
				feedbackCategories.name,
				feedbackCategories.sortOrder
			)
			.orderBy(feedbackCategories.sortOrder);

		return results.map((r) => ({
			categoryId: r.categoryId,
			categoryName: r.categoryName,
			avgRating: Number.parseFloat((Number(r.avgRating) || 0).toFixed(2)),
			responseCount: r.responseCount,
			sortOrder: r.sortOrder,
		}));
	}

	async getRatingDistribution(
		filter: FeedbackReportFilter
	): Promise<RatingDistribution[]> {
		const conditions = buildFilterConditions(filter);

		const results = await db
			.select({
				rating: feedbackResponses.rating,
				count: count(feedbackResponses.id),
			})
			.from(feedbackResponses)
			.innerJoin(
				feedbackPassphrases,
				eq(feedbackResponses.passphraseId, feedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(feedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(feedbackPassphrases.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				assignedModules,
				eq(feedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(
				and(
					isNotNull(feedbackResponses.rating),
					...(conditions.length > 0 ? conditions : [])
				)
			)
			.groupBy(feedbackResponses.rating)
			.orderBy(feedbackResponses.rating);

		const total = results.reduce((sum, r) => sum + r.count, 0);

		const allRatings: RatingDistribution[] = [1, 2, 3, 4, 5].map((rating) => {
			const found = results.find((r) => r.rating === rating);
			const cnt = found?.count ?? 0;
			return {
				rating,
				count: cnt,
				percentage: total > 0 ? Math.round((cnt / total) * 100) : 0,
			};
		});

		return allRatings;
	}

	async getLecturerRankings(
		filter: FeedbackReportFilter
	): Promise<LecturerRanking[]> {
		const conditions = buildFilterConditions(filter);

		const lecturerRows = await db
			.select({
				userId: assignedModules.userId,
				lecturerName: users.name,
				schoolCode: schools.code,
				schoolName: schools.name,
				categoryId: feedbackCategories.id,
				categoryName: feedbackCategories.name,
				avgRating: avg(feedbackResponses.rating),
				responseCount: count(feedbackResponses.id),
			})
			.from(feedbackResponses)
			.innerJoin(
				feedbackQuestions,
				eq(feedbackResponses.questionId, feedbackQuestions.id)
			)
			.innerJoin(
				feedbackCategories,
				eq(feedbackQuestions.categoryId, feedbackCategories.id)
			)
			.innerJoin(
				feedbackPassphrases,
				eq(feedbackResponses.passphraseId, feedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(feedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(feedbackPassphrases.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				assignedModules,
				eq(feedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(users, eq(assignedModules.userId, users.id))
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(
				and(
					isNotNull(feedbackResponses.rating),
					...(conditions.length > 0 ? conditions : [])
				)
			)
			.groupBy(
				assignedModules.userId,
				users.name,
				schools.code,
				schools.name,
				feedbackCategories.id,
				feedbackCategories.name
			);

		const moduleCountRows = await db
			.select({
				userId: assignedModules.userId,
				moduleCount: countDistinct(assignedModules.semesterModuleId),
			})
			.from(feedbackResponses)
			.innerJoin(
				assignedModules,
				eq(feedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				feedbackPassphrases,
				eq(feedbackResponses.passphraseId, feedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(feedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(feedbackPassphrases.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.groupBy(assignedModules.userId);

		const moduleCountMap = new Map<string, number>();
		for (const row of moduleCountRows) {
			moduleCountMap.set(row.userId, row.moduleCount);
		}

		const lecturerMap = new Map<string, LecturerRanking>();

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
			lecturer.categoryAverages[row.categoryName] = Number.parseFloat(
				(Number(row.avgRating) || 0).toFixed(2)
			);
		}

		for (const lecturer of lecturerMap.values()) {
			const catValues = Object.values(lecturer.categoryAverages);
			if (catValues.length > 0) {
				lecturer.avgRating = Number.parseFloat(
					(catValues.reduce((a, b) => a + b, 0) / catValues.length).toFixed(2)
				);
			}
		}

		return Array.from(lecturerMap.values()).sort(
			(a, b) => b.avgRating - a.avgRating
		);
	}

	async getQuestionBreakdown(
		filter: FeedbackReportFilter
	): Promise<QuestionBreakdownItem[]> {
		const conditions = buildFilterConditions(filter);

		const results = await db
			.select({
				questionId: feedbackQuestions.id,
				questionText: feedbackQuestions.text,
				categoryId: feedbackCategories.id,
				categoryName: feedbackCategories.name,
				categorySortOrder: feedbackCategories.sortOrder,
				questionSortOrder: feedbackQuestions.sortOrder,
				rating: feedbackResponses.rating,
				count: count(feedbackResponses.id),
			})
			.from(feedbackResponses)
			.innerJoin(
				feedbackQuestions,
				eq(feedbackResponses.questionId, feedbackQuestions.id)
			)
			.innerJoin(
				feedbackCategories,
				eq(feedbackQuestions.categoryId, feedbackCategories.id)
			)
			.innerJoin(
				feedbackPassphrases,
				eq(feedbackResponses.passphraseId, feedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(feedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(feedbackPassphrases.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				assignedModules,
				eq(feedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(
				and(
					isNotNull(feedbackResponses.rating),
					...(conditions.length > 0 ? conditions : [])
				)
			)
			.groupBy(
				feedbackQuestions.id,
				feedbackQuestions.text,
				feedbackCategories.id,
				feedbackCategories.name,
				feedbackCategories.sortOrder,
				feedbackQuestions.sortOrder,
				feedbackResponses.rating
			)
			.orderBy(feedbackCategories.sortOrder, feedbackQuestions.sortOrder);

		const questionMap = new Map<string, QuestionBreakdownItem>();

		for (const row of results) {
			if (!questionMap.has(row.questionId)) {
				questionMap.set(row.questionId, {
					questionId: row.questionId,
					questionText: row.questionText,
					categoryId: row.categoryId,
					categoryName: row.categoryName,
					categorySortOrder: row.categorySortOrder,
					questionSortOrder: row.questionSortOrder,
					avgRating: 0,
					responseCount: 0,
					distribution: [1, 2, 3, 4, 5].map((r) => ({
						rating: r,
						count: 0,
						percentage: 0,
					})),
				});
			}
			const question = questionMap.get(row.questionId)!;
			if (row.rating !== null) {
				const distItem = question.distribution.find(
					(d) => d.rating === row.rating
				);
				if (distItem) {
					distItem.count = row.count;
				}
			}
		}

		for (const question of questionMap.values()) {
			const totalCount = question.distribution.reduce(
				(sum, d) => sum + d.count,
				0
			);
			question.responseCount = totalCount;
			if (totalCount > 0) {
				const weightedSum = question.distribution.reduce(
					(sum, d) => sum + d.rating * d.count,
					0
				);
				question.avgRating = Number.parseFloat(
					(weightedSum / totalCount).toFixed(2)
				);
				for (const d of question.distribution) {
					d.percentage = Math.round((d.count / totalCount) * 100);
				}
			}
		}

		return Array.from(questionMap.values()).sort(
			(a, b) =>
				a.categorySortOrder - b.categorySortOrder ||
				a.questionSortOrder - b.questionSortOrder
		);
	}

	async getLecturerDetail(
		userId: string,
		filter: FeedbackReportFilter
	): Promise<LecturerDetail | null> {
		const conditions = buildFilterConditions(filter);
		const allConditions = [
			eq(assignedModules.userId, userId),
			isNotNull(feedbackResponses.rating),
			...conditions,
		];

		const [lecturerInfo] = await db
			.select({
				userId: assignedModules.userId,
				lecturerName: users.name,
				schoolCode: schools.code,
				avgRating: avg(feedbackResponses.rating),
			})
			.from(feedbackResponses)
			.innerJoin(
				assignedModules,
				eq(feedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(users, eq(assignedModules.userId, users.id))
			.innerJoin(
				feedbackPassphrases,
				eq(feedbackResponses.passphraseId, feedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(feedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(feedbackPassphrases.structureSemesterId, structureSemesters.id)
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

		const moduleRows = await db
			.select({
				moduleCode: modules.code,
				moduleName: modules.name,
				avgRating: avg(feedbackResponses.rating),
				responseCount: count(feedbackResponses.id),
				programCode: programs.code,
				semesterNumber: structureSemesters.semesterNumber,
			})
			.from(feedbackResponses)
			.innerJoin(
				assignedModules,
				eq(feedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				feedbackPassphrases,
				eq(feedbackResponses.passphraseId, feedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(feedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(feedbackPassphrases.structureSemesterId, structureSemesters.id)
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

		const modulesResult: LecturerModuleBreakdown[] = moduleRows.map((r) => {
			const year = Math.ceil(Number(r.semesterNumber) / 2);
			const sem = Number(r.semesterNumber) % 2 === 0 ? 2 : 1;
			return {
				moduleCode: r.moduleCode,
				moduleName: r.moduleName,
				avgRating: Number.parseFloat((Number(r.avgRating) || 0).toFixed(2)),
				responseCount: r.responseCount,
				className: `${r.programCode}Y${year}S${sem}`,
			};
		});

		const overallQuestionAvgs = await this.getQuestionBreakdown(filter);
		const overallAvgMap = new Map<string, number>();
		for (const q of overallQuestionAvgs) {
			overallAvgMap.set(q.questionId, q.avgRating);
		}

		const questionRows = await db
			.select({
				questionId: feedbackQuestions.id,
				questionText: feedbackQuestions.text,
				categoryName: feedbackCategories.name,
				rating: feedbackResponses.rating,
				count: count(feedbackResponses.id),
			})
			.from(feedbackResponses)
			.innerJoin(
				feedbackQuestions,
				eq(feedbackResponses.questionId, feedbackQuestions.id)
			)
			.innerJoin(
				feedbackCategories,
				eq(feedbackQuestions.categoryId, feedbackCategories.id)
			)
			.innerJoin(
				assignedModules,
				eq(feedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				feedbackPassphrases,
				eq(feedbackResponses.passphraseId, feedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(feedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(feedbackPassphrases.structureSemesterId, structureSemesters.id)
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
				feedbackQuestions.id,
				feedbackQuestions.text,
				feedbackCategories.name,
				feedbackResponses.rating
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
				q.avgRating = Number.parseFloat((weightedSum / totalCount).toFixed(2));
				for (const d of q.distribution) {
					d.percentage = Math.round((d.count / totalCount) * 100);
				}
			}
		}

		const commentConditions = [
			eq(assignedModules.userId, userId),
			isNotNull(feedbackResponses.comment),
			...conditions,
		];

		const commentRows = await db
			.select({
				moduleCode: modules.code,
				moduleName: modules.name,
				programCode: programs.code,
				semesterNumber: structureSemesters.semesterNumber,
				comment: feedbackResponses.comment,
			})
			.from(feedbackResponses)
			.innerJoin(
				assignedModules,
				eq(feedbackResponses.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				feedbackPassphrases,
				eq(feedbackResponses.passphraseId, feedbackPassphrases.id)
			)
			.innerJoin(
				feedbackCycles,
				eq(feedbackPassphrases.cycleId, feedbackCycles.id)
			)
			.innerJoin(
				structureSemesters,
				eq(feedbackPassphrases.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...commentConditions));

		const commentsResult: LecturerComment[] = commentRows
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

		return {
			userId: lecturerInfo.userId,
			lecturerName: lecturerInfo.lecturerName ?? 'Unknown',
			schoolCode: lecturerInfo.schoolCode,
			avgRating: Number.parseFloat(
				(Number(lecturerInfo.avgRating) || 0).toFixed(2)
			),
			modules: modulesResult,
			questions: Array.from(qMap.values()),
			comments: commentsResult,
		};
	}

	async getCyclesByTerm(termId: number) {
		return db
			.select({
				id: feedbackCycles.id,
				name: feedbackCycles.name,
			})
			.from(feedbackCycles)
			.where(eq(feedbackCycles.termId, termId))
			.orderBy(feedbackCycles.name);
	}

	async getModulesForFilter(filter: FeedbackReportFilter) {
		const conditions = [];
		if (filter.termId) {
			conditions.push(eq(assignedModules.termId, filter.termId));
		}
		if (filter.schoolIds && filter.schoolIds.length > 0) {
			conditions.push(inArray(schools.id, filter.schoolIds));
		}
		if (filter.programId) {
			conditions.push(eq(programs.id, filter.programId));
		}

		return db
			.selectDistinct({
				id: modules.id,
				code: modules.code,
				name: modules.name,
			})
			.from(assignedModules)
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
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(modules.code);
	}
}

export const feedbackReportRepository = new FeedbackReportRepository();
