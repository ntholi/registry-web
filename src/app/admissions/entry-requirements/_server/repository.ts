import { type ProgramLevel, programs, schools } from '@academic/_database';
import { subjects } from '@admissions/_database';
import {
	and,
	asc,
	count,
	countDistinct,
	eq,
	ilike,
	inArray,
	or,
} from 'drizzle-orm';
import { db, entryRequirements } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import type {
	EntryRequirementSummary,
	EntryRules,
	PublicCoursesData,
} from '../_lib/types';

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

	async findProgramsWithRequirementsPublic(
		page: number,
		search: string,
		filter?: EntryRequirementsFilter
	) {
		const { items, totalPages, totalItems } =
			await this.findProgramsWithRequirements(page, search, filter);

		if (items.length === 0) {
			return { items: [], totalPages, totalItems };
		}

		const programIds = items.map((item) => item.id);
		const requirements = await db.query.entryRequirements.findMany({
			where: inArray(entryRequirements.programId, programIds),
			with: {
				certificateType: true,
			},
			orderBy: (er, { asc }) => [asc(er.programId), asc(er.certificateTypeId)],
		});

		const requirementsByProgram = new Map<number, EntryRequirementSummary[]>();

		for (const requirement of requirements) {
			const list = requirementsByProgram.get(requirement.programId) ?? [];
			list.push({
				id: requirement.id,
				rules: requirement.rules as EntryRules,
				certificateType: requirement.certificateType,
			});
			requirementsByProgram.set(requirement.programId, list);
		}

		const enrichedItems = items.map((program) => ({
			...program,
			entryRequirements: requirementsByProgram.get(program.id) ?? [],
		}));

		return {
			items: enrichedItems,
			totalPages,
			totalItems,
		};
	}

	async findAllForEligibility() {
		return db.query.entryRequirements.findMany({
			with: {
				program: true,
				certificateType: true,
			},
			orderBy: (er, { asc }) => [asc(er.programId)],
		});
	}

	async findSchoolsWithRequirements() {
		const programIdsWithRequirements = db
			.selectDistinct({ programId: entryRequirements.programId })
			.from(entryRequirements);

		return db
			.selectDistinct({
				id: schools.id,
				code: schools.code,
				name: schools.name,
				shortName: schools.shortName,
			})
			.from(schools)
			.innerJoin(programs, eq(programs.schoolId, schools.id))
			.where(inArray(programs.id, programIdsWithRequirements))
			.orderBy(asc(schools.name));
	}

	async findPublicCoursesData(
		page: number,
		search: string,
		filter?: EntryRequirementsFilter
	): Promise<PublicCoursesData> {
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

		const [programItems, [{ total }], schoolItems, subjectItems] =
			await Promise.all([
				db.query.programs.findMany({
					where: whereClause,
					limit: pageSize,
					offset,
					orderBy: (p, { asc }) => [asc(p.code)],
					with: { school: true },
				}),
				db
					.select({ total: countDistinct(programs.id) })
					.from(programs)
					.where(whereClause),
				db
					.selectDistinct({
						id: schools.id,
						code: schools.code,
						name: schools.name,
						shortName: schools.shortName,
					})
					.from(schools)
					.innerJoin(programs, eq(programs.schoolId, schools.id))
					.where(inArray(programs.id, programIdsWithRequirements))
					.orderBy(asc(schools.name)),
				db.query.subjects.findMany({
					where: eq(subjects.isActive, true),
					orderBy: (s, { asc }) => [asc(s.name)],
					columns: { id: true, name: true },
				}),
			]);

		let enrichedItems: Array<
			(typeof programItems)[0] & {
				entryRequirements: EntryRequirementSummary[];
			}
		> = [];

		if (programItems.length > 0) {
			const programIds = programItems.map((item) => item.id);
			const requirements = await db.query.entryRequirements.findMany({
				where: inArray(entryRequirements.programId, programIds),
				with: { certificateType: true },
				orderBy: (er, { asc }) => [
					asc(er.programId),
					asc(er.certificateTypeId),
				],
			});

			const requirementsByProgram = new Map<
				number,
				EntryRequirementSummary[]
			>();
			for (const requirement of requirements) {
				const list = requirementsByProgram.get(requirement.programId) ?? [];
				list.push({
					id: requirement.id,
					rules: requirement.rules as EntryRules,
					certificateType: requirement.certificateType,
				});
				requirementsByProgram.set(requirement.programId, list);
			}

			enrichedItems = programItems.map((program) => ({
				...program,
				entryRequirements: requirementsByProgram.get(program.id) ?? [],
			}));
		}

		return {
			programs: {
				items: enrichedItems,
				totalPages: Math.ceil(total / pageSize),
				totalItems: total,
			},
			schools: schoolItems,
			subjects: subjectItems,
		};
	}
}
