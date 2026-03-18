import {
	and,
	count,
	desc,
	eq,
	getTableColumns,
	inArray,
	sql,
} from 'drizzle-orm';
import {
	db,
	feedbackCycleSchools,
	feedbackCycles,
	programs,
	schools,
	structureSemesters,
	structures,
	studentFeedbackPassphrases,
	studentSemesters,
	terms,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export default class FeedbackCycleRepository extends BaseRepository<
	typeof feedbackCycles,
	'id'
> {
	constructor() {
		super(feedbackCycles, feedbackCycles.id);
	}

	override async findById(id: string) {
		return db.query.feedbackCycles.findFirst({
			where: eq(feedbackCycles.id, id),
			with: {
				term: true,
				cycleSchools: { with: { school: true } },
			},
		});
	}

	async queryWithSchoolCodes(
		options: QueryOptions<typeof feedbackCycles>,
		userSchoolIds?: number[]
	) {
		const { orderBy, where, offset, limit } = this.buildQueryCriteria(options);
		const schoolFilter =
			userSchoolIds && userSchoolIds.length > 0
				? inArray(feedbackCycleSchools.schoolId, userSchoolIds)
				: undefined;
		const combinedWhere = schoolFilter
			? where
				? and(
						where,
						sql`${feedbackCycles.id} in (select ${feedbackCycleSchools.cycleId} from ${feedbackCycleSchools} where ${schoolFilter})`
					)
				: sql`${feedbackCycles.id} in (select ${feedbackCycleSchools.cycleId} from ${feedbackCycleSchools} where ${schoolFilter})`
			: where;
		const items = await db
			.select({
				...getTableColumns(feedbackCycles),
				schoolCodes: sql<
					string[]
				>`coalesce(array_agg(${schools.code} order by ${schools.code}) filter (where ${schools.code} is not null), '{}')`,
			})
			.from(feedbackCycles)
			.leftJoin(
				feedbackCycleSchools,
				eq(feedbackCycleSchools.cycleId, feedbackCycles.id)
			)
			.leftJoin(schools, eq(schools.id, feedbackCycleSchools.schoolId))
			.groupBy(feedbackCycles.id)
			.orderBy(...orderBy)
			.where(combinedWhere)
			.limit(limit)
			.offset(offset);
		return this.createPaginatedResult(items, { where: combinedWhere, limit });
	}

	async createWithSchools(
		data: typeof feedbackCycles.$inferInsert,
		schoolIds: number[]
	) {
		return db.transaction(async (tx) => {
			const [cycle] = await tx.insert(feedbackCycles).values(data).returning();
			if (schoolIds.length > 0) {
				await tx
					.insert(feedbackCycleSchools)
					.values(
						schoolIds.map((schoolId) => ({ cycleId: cycle.id, schoolId }))
					);
			}
			return cycle;
		});
	}

	async updateWithSchools(
		id: string,
		data: Partial<typeof feedbackCycles.$inferInsert>,
		schoolIds: number[]
	) {
		return db.transaction(async (tx) => {
			const [cycle] = await tx
				.update(feedbackCycles)
				.set(data)
				.where(eq(feedbackCycles.id, id))
				.returning();
			await tx
				.delete(feedbackCycleSchools)
				.where(eq(feedbackCycleSchools.cycleId, id));
			if (schoolIds.length > 0) {
				await tx
					.insert(feedbackCycleSchools)
					.values(schoolIds.map((schoolId) => ({ cycleId: id, schoolId })));
			}
			return cycle;
		});
	}

	async getClassesForCycle(cycleId: string, termId: number) {
		const term = await db.query.terms.findFirst({
			where: eq(terms.id, termId),
		});
		if (!term) return [];

		const rows = await db
			.select({
				structureSemesterId: structureSemesters.id,
				semesterNumber: structureSemesters.semesterNumber,
				structureId: structures.id,
				programCode: programs.code,
				programName: programs.name,
				schoolId: schools.id,
				schoolName: schools.name,
				studentCount: count(studentSemesters.id),
			})
			.from(studentSemesters)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				feedbackCycleSchools,
				and(
					eq(feedbackCycleSchools.schoolId, schools.id),
					eq(feedbackCycleSchools.cycleId, cycleId)
				)
			)
			.where(eq(studentSemesters.termCode, term.code))
			.groupBy(
				structureSemesters.id,
				structureSemesters.semesterNumber,
				structures.id,
				programs.code,
				programs.name,
				schools.id,
				schools.name
			)
			.orderBy(schools.name, programs.code, structureSemesters.semesterNumber);

		const grouped = new Map<
			number,
			{
				schoolId: number;
				schoolName: string;
				classes: {
					structureSemesterId: number;
					semesterNumber: string;
					programCode: string;
					programName: string;
					studentCount: number;
				}[];
			}
		>();

		for (const row of rows) {
			if (!grouped.has(row.schoolId)) {
				grouped.set(row.schoolId, {
					schoolId: row.schoolId,
					schoolName: row.schoolName,
					classes: [],
				});
			}
			grouped.get(row.schoolId)!.classes.push({
				structureSemesterId: row.structureSemesterId,
				semesterNumber: row.semesterNumber,
				programCode: row.programCode,
				programName: row.programName,
				studentCount: row.studentCount,
			});
		}

		return Array.from(grouped.values());
	}

	async getPassphraseStats(cycleId: string) {
		const rows = await db
			.select({
				structureSemesterId: studentFeedbackPassphrases.structureSemesterId,
				total: count(studentFeedbackPassphrases.id),
				used: sql<number>`count(case when ${studentFeedbackPassphrases.used} = true then 1 end)`.as(
					'used'
				),
			})
			.from(studentFeedbackPassphrases)
			.where(eq(studentFeedbackPassphrases.cycleId, cycleId))
			.groupBy(studentFeedbackPassphrases.structureSemesterId);

		const result: Record<
			number,
			{ total: number; used: number; remaining: number }
		> = {};
		for (const row of rows) {
			result[row.structureSemesterId] = {
				total: row.total,
				used: row.used,
				remaining: row.total - row.used,
			};
		}
		return result;
	}

	async getExistingPassphrases(cycleId: string) {
		const rows = await db
			.select({ passphrase: studentFeedbackPassphrases.passphrase })
			.from(studentFeedbackPassphrases)
			.where(eq(studentFeedbackPassphrases.cycleId, cycleId));

		return new Set(rows.map((r) => r.passphrase));
	}

	async createPassphrases(
		passphrases: {
			cycleId: string;
			structureSemesterId: number;
			passphrase: string;
		}[]
	) {
		if (passphrases.length === 0) return;
		await db.insert(studentFeedbackPassphrases).values(passphrases);
	}

	async getLatestRelevantCycle(
		termId: number,
		schoolIds: number[],
		startDate: string
	) {
		const ids = [
			...new Set(schoolIds.filter((id) => Number.isInteger(id) && id > 0)),
		];
		const schoolFilter =
			ids.length > 0
				? sql`exists (
					select 1
					from ${feedbackCycleSchools} as recent_cycle_schools
					where recent_cycle_schools.cycle_id = ${feedbackCycles.id}
					and recent_cycle_schools.school_id in (${sql.join(
						ids.map((id) => sql`${id}`),
						sql`, `
					)})
				)`
				: sql`not exists (
					select 1
					from ${feedbackCycleSchools} as recent_cycle_schools
					where recent_cycle_schools.cycle_id = ${feedbackCycles.id}
				)`;

		const [cycle] = await db
			.select({
				id: feedbackCycles.id,
				name: feedbackCycles.name,
				startDate: feedbackCycles.startDate,
				endDate: feedbackCycles.endDate,
				schoolCodes: sql<
					string[]
				>`coalesce(array_agg(distinct ${schools.code} order by ${schools.code}) filter (where ${schools.code} is not null), '{}')`,
			})
			.from(feedbackCycles)
			.leftJoin(
				feedbackCycleSchools,
				eq(feedbackCycleSchools.cycleId, feedbackCycles.id)
			)
			.leftJoin(schools, eq(schools.id, feedbackCycleSchools.schoolId))
			.where(
				and(
					eq(feedbackCycles.termId, termId),
					sql`${feedbackCycles.endDate}::date >= ${startDate}::date`,
					schoolFilter
				)
			)
			.groupBy(feedbackCycles.id)
			.orderBy(desc(feedbackCycles.endDate), desc(feedbackCycles.createdAt))
			.limit(1);

		return cycle ?? null;
	}

	async getPassphrasesForClass(cycleId: string, structureSemesterId: number) {
		return db
			.select({ passphrase: studentFeedbackPassphrases.passphrase })
			.from(studentFeedbackPassphrases)
			.where(
				and(
					eq(studentFeedbackPassphrases.cycleId, cycleId),
					eq(
						studentFeedbackPassphrases.structureSemesterId,
						structureSemesterId
					)
				)
			)
			.orderBy(studentFeedbackPassphrases.id);
	}
}

export const feedbackCycleRepository = new FeedbackCycleRepository();
