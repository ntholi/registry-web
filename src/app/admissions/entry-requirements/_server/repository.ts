import { type ProgramLevel, programs } from '@academic/_database';
import { and, count, countDistinct, eq, ilike, inArray, or } from 'drizzle-orm';
import { db, entryRequirements } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export interface EntryRequirementsFilter {
	schoolId?: number;
	level?: ProgramLevel;
}

export default class EntryRequirementRepository extends BaseRepository<
	typeof entryRequirements,
	'id'
> {
	constructor() {
		super(entryRequirements, entryRequirements.id);
	}

	override async findById(id: string) {
		return db.query.entryRequirements.findFirst({
			where: eq(entryRequirements.id, id),
			with: {
				program: true,
				certificateType: true,
			},
		});
	}

	async findByProgram(programId: number) {
		return db.query.entryRequirements.findMany({
			where: eq(entryRequirements.programId, programId),
			with: {
				program: {
					with: {
						school: true,
					},
				},
				certificateType: true,
			},
			orderBy: (er, { asc }) => [asc(er.certificateTypeId)],
		});
	}

	async findByProgramAndCertificate(
		programId: number,
		certificateTypeId: string
	) {
		return db.query.entryRequirements.findFirst({
			where: and(
				eq(entryRequirements.programId, programId),
				eq(entryRequirements.certificateTypeId, certificateTypeId)
			),
		});
	}

	async findAllWithRelations(page: number, _search: string) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const [items, [{ total }]] = await Promise.all([
			db.query.entryRequirements.findMany({
				limit: pageSize,
				offset,
				orderBy: (er, { asc }) => [asc(er.programId)],
				with: {
					program: true,
					certificateType: true,
				},
			}),
			db.select({ total: count() }).from(entryRequirements),
		]);

		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}

	async findProgramsWithRequirements(
		page: number,
		search: string,
		filter?: EntryRequirementsFilter
	) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const programIdsWithRequirements = db
			.selectDistinct({ programId: entryRequirements.programId })
			.from(entryRequirements);

		const conditions = [inArray(programs.id, programIdsWithRequirements)];

		if (search) {
			conditions.push(
				or(
					ilike(programs.code, `%${search}%`),
					ilike(programs.name, `%${search}%`)
				)!
			);
		}

		if (filter?.schoolId) {
			conditions.push(eq(programs.schoolId, filter.schoolId));
		}

		if (filter?.level) {
			conditions.push(eq(programs.level, filter.level));
		}

		const whereClause = and(...conditions);

		const [items, [{ total }]] = await Promise.all([
			db.query.programs.findMany({
				where: whereClause,
				limit: pageSize,
				offset,
				orderBy: (p, { asc }) => [asc(p.code)],
				with: {
					school: true,
				},
			}),
			db
				.select({ total: countDistinct(programs.id) })
				.from(programs)
				.where(whereClause),
		]);

		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}
}
