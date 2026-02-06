import { and, desc, eq, sql } from 'drizzle-orm';
import { db, questionPapers } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class QuestionPaperRepository extends BaseRepository<
	typeof questionPapers,
	'id'
> {
	constructor() {
		super(questionPapers, questionPapers.id);
	}

	async findByIdWithRelations(id: string) {
		return db.query.questionPapers.findFirst({
			where: eq(questionPapers.id, id),
			with: {
				document: true,
				module: true,
				term: true,
			},
		});
	}

	async getQuestionPapersWithFilters(
		page: number,
		search: string,
		moduleId?: number,
		termId?: number
	) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (moduleId) {
			conditions.push(eq(questionPapers.moduleId, moduleId));
		}
		if (termId) {
			conditions.push(eq(questionPapers.termId, termId));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		let data = await db.query.questionPapers.findMany({
			where: whereClause,
			with: {
				document: true,
				module: true,
				term: true,
			},
			orderBy: desc(questionPapers.createdAt),
			limit: pageSize,
			offset,
		});

		if (search) {
			const searchLower = search.toLowerCase();
			data = data.filter(
				(item) =>
					item.module?.code.toLowerCase().includes(searchLower) ||
					item.module?.name.toLowerCase().includes(searchLower)
			);
		}

		const [countResult] = await db
			.select({ count: sql<number>`count(*)` })
			.from(questionPapers)
			.where(whereClause);

		return {
			items: data,
			totalPages: Math.ceil((countResult?.count || 0) / pageSize),
			totalItems: countResult?.count || 0,
		};
	}
}

export const questionPapersRepository = new QuestionPaperRepository();
