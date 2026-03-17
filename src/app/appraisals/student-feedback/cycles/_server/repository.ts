import { and, count, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import {
	db,
	programs,
	schools,
	structureSemesters,
	structures,
	studentFeedbackCycleSchools,
	studentFeedbackCycles,
	studentFeedbackPassphrases,
	studentSemesters,
	terms,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export default class StudentFeedbackCycleRepository extends BaseRepository<
	typeof studentFeedbackCycles,
	'id'
> {
	constructor() {
		super(studentFeedbackCycles, studentFeedbackCycles.id);
	}

	override async findById(id: string) {
		return db.query.studentFeedbackCycles.findFirst({
			where: eq(studentFeedbackCycles.id, id),
			with: {
				term: true,
				cycleSchools: { with: { school: true } },
			},
		});
	}

	async queryWithSchoolCodes(
		options: QueryOptions<typeof studentFeedbackCycles>,
		userSchoolIds?: number[]
	) {
		const { orderBy, where, offset, limit } = this.buildQueryCriteria(options);
		const schoolFilter =
			userSchoolIds && userSchoolIds.length > 0
				? inArray(studentFeedbackCycleSchools.schoolId, userSchoolIds)
				: undefined;
		const combinedWhere = schoolFilter
			? where
				? and(
						where,
						sql`${studentFeedbackCycles.id} in (select ${studentFeedbackCycleSchools.cycleId} from ${studentFeedbackCycleSchools} where ${schoolFilter})`
					)
				: sql`${studentFeedbackCycles.id} in (select ${studentFeedbackCycleSchools.cycleId} from ${studentFeedbackCycleSchools} where ${schoolFilter})`
			: where;
		const items = await db
			.select({
				...getTableColumns(studentFeedbackCycles),
				schoolCodes: sql<
					string[]
				>`coalesce(array_agg(${schools.code} order by ${schools.code}) filter (where ${schools.code} is not null), '{}')`,
			})
			.from(studentFeedbackCycles)
			.leftJoin(
				studentFeedbackCycleSchools,
				eq(studentFeedbackCycleSchools.cycleId, studentFeedbackCycles.id)
			)
			.leftJoin(schools, eq(schools.id, studentFeedbackCycleSchools.schoolId))
			.groupBy(studentFeedbackCycles.id)
			.orderBy(...orderBy)
			.where(combinedWhere)
			.limit(limit)
			.offset(offset);
		return this.createPaginatedResult(items, { where: combinedWhere, limit });
	}

	async createWithSchools(
		data: typeof studentFeedbackCycles.$inferInsert,
		schoolIds: number[]
	) {
		return db.transaction(async (tx) => {
			const [cycle] = await tx
				.insert(studentFeedbackCycles)
				.values(data)
				.returning();
			if (schoolIds.length > 0) {
				await tx
					.insert(studentFeedbackCycleSchools)
					.values(
						schoolIds.map((schoolId) => ({ cycleId: cycle.id, schoolId }))
					);
			}
			return cycle;
		});
	}

	async updateWithSchools(
		id: string,
		data: Partial<typeof studentFeedbackCycles.$inferInsert>,
		schoolIds: number[]
	) {
		return db.transaction(async (tx) => {
			const [cycle] = await tx
				.update(studentFeedbackCycles)
				.set(data)
				.where(eq(studentFeedbackCycles.id, id))
				.returning();
			await tx
				.delete(studentFeedbackCycleSchools)
				.where(eq(studentFeedbackCycleSchools.cycleId, id));
			if (schoolIds.length > 0) {
				await tx
					.insert(studentFeedbackCycleSchools)
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
				studentFeedbackCycleSchools,
				and(
					eq(studentFeedbackCycleSchools.schoolId, schools.id),
					eq(studentFeedbackCycleSchools.cycleId, cycleId)
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

export const feedbackCycleRepository = new StudentFeedbackCycleRepository();
