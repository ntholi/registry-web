import { desc, eq } from 'drizzle-orm';
import { db, graduations, terms } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export type GraduationInsert = typeof graduations.$inferInsert;

export default class GraduationRepository extends BaseRepository<
	typeof graduations,
	'id'
> {
	constructor() {
		super(graduations, graduations.id);
	}

	async findAll() {
		return db
			.select({
				id: graduations.id,
				graduationDate: graduations.graduationDate,
				termId: graduations.termId,
				createdAt: graduations.createdAt,
				term: terms,
			})
			.from(graduations)
			.leftJoin(terms, eq(graduations.termId, terms.id))
			.orderBy(desc(graduations.graduationDate));
	}

	async findById(id: number) {
		const result = await db
			.select({
				id: graduations.id,
				graduationDate: graduations.graduationDate,
				termId: graduations.termId,
				createdAt: graduations.createdAt,
				term: terms,
			})
			.from(graduations)
			.leftJoin(terms, eq(graduations.termId, terms.id))
			.where(eq(graduations.id, id));
		return result[0];
	}
}

export const graduationsRepository = new GraduationRepository();
