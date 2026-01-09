import { and, count, eq } from 'drizzle-orm';
import { db, entryRequirements } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class EntryRequirementRepository extends BaseRepository<
	typeof entryRequirements,
	'id'
> {
	constructor() {
		super(entryRequirements, entryRequirements.id);
	}

	override async findById(id: number) {
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
				program: true,
				certificateType: true,
			},
		});
	}

	async findByProgramAndCertificate(
		programId: number,
		certificateTypeId: number
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
}
