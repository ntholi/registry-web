import { and, count, eq, getTableColumns, sql } from 'drizzle-orm';
import {
	db,
	feedbackCycleSchools,
	feedbackCycles,
	feedbackPassphrases,
	programs,
	schools,
	structureSemesters,
	structures,
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

	async queryWithSchoolCodes(options: QueryOptions<typeof feedbackCycles>) {
		const { orderBy, where, offset, limit } = this.buildQueryCriteria(options);
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
			.where(where)
			.limit(limit)
			.offset(offset);
		return this.createPaginatedResult(items, { where, limit });
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
				structureSemesterId: feedbackPassphrases.structureSemesterId,
				total: count(feedbackPassphrases.id),
				used: sql<number>`count(case when ${feedbackPassphrases.used} = true then 1 end)`.as(
					'used'
				),
			})
			.from(feedbackPassphrases)
			.where(eq(feedbackPassphrases.cycleId, cycleId))
			.groupBy(feedbackPassphrases.structureSemesterId);

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
			.select({ passphrase: feedbackPassphrases.passphrase })
			.from(feedbackPassphrases)
			.where(eq(feedbackPassphrases.cycleId, cycleId));

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
		await db.insert(feedbackPassphrases).values(passphrases);
	}

	async getPassphrasesForClass(cycleId: string, structureSemesterId: number) {
		return db
			.select({ passphrase: feedbackPassphrases.passphrase })
			.from(feedbackPassphrases)
			.where(
				and(
					eq(feedbackPassphrases.cycleId, cycleId),
					eq(feedbackPassphrases.structureSemesterId, structureSemesterId)
				)
			)
			.orderBy(feedbackPassphrases.id);
	}
}

export const feedbackCycleRepository = new FeedbackCycleRepository();
