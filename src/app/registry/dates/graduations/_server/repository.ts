import { desc, eq } from 'drizzle-orm';
import { db, graduationDates, terms } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export type GraduationInsert = typeof graduationDates.$inferInsert;

export default class GraduationRepository extends BaseRepository<
	typeof graduationDates,
	'id'
> {
	constructor() {
		super(graduationDates, graduationDates.id);
	}

	async findByDate(date: string) {
		return db.query.graduationDates.findFirst({
			where: eq(graduationDates.date, date),
			with: { term: true },
		});
	}

	async findLatest() {
		const result = await db
			.select({
				id: graduationDates.id,
				date: graduationDates.date,
				termId: graduationDates.termId,
				createdAt: graduationDates.createdAt,
				term: terms,
			})
			.from(graduationDates)
			.leftJoin(terms, eq(graduationDates.termId, terms.id))
			.orderBy(desc(graduationDates.date))
			.limit(1);
		return result[0] || null;
	}

	async findAll() {
		return db
			.select({
				id: graduationDates.id,
				date: graduationDates.date,
				termId: graduationDates.termId,
				createdAt: graduationDates.createdAt,
				term: terms,
			})
			.from(graduationDates)
			.leftJoin(terms, eq(graduationDates.termId, terms.id))
			.orderBy(desc(graduationDates.date));
	}

	async findById(id: number) {
		const result = await db
			.select({
				id: graduationDates.id,
				date: graduationDates.date,
				termId: graduationDates.termId,
				createdAt: graduationDates.createdAt,
				term: terms,
			})
			.from(graduationDates)
			.leftJoin(terms, eq(graduationDates.termId, terms.id))
			.where(eq(graduationDates.id, id));
		return result[0];
	}
}
