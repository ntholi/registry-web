import { asc, eq } from 'drizzle-orm';
import { db, feedbackCategories, feedbackQuestions } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

interface CategoryQuestionBoard {
	id: string;
	name: string;
	sortOrder: number;
	questionCount: number;
	questions: Array<{
		id: string;
		categoryId: string;
		text: string;
		sortOrder: number;
	}>;
}

export default class FeedbackQuestionRepository extends BaseRepository<
	typeof feedbackQuestions,
	'id'
> {
	constructor() {
		super(feedbackQuestions, feedbackQuestions.id);
	}

	override async findById(id: string) {
		return db.query.feedbackQuestions.findFirst({
			where: eq(feedbackQuestions.id, id),
			with: { category: true },
		});
	}

	async findAllWithCategories() {
		return db.query.feedbackQuestions.findMany({
			with: { category: true },
			orderBy: (q) => [asc(q.sortOrder)],
		});
	}

	async findQuestionBoard(): Promise<CategoryQuestionBoard[]> {
		const rows = await db
			.select({
				categoryId: feedbackCategories.id,
				categoryName: feedbackCategories.name,
				categorySortOrder: feedbackCategories.sortOrder,
				questionId: feedbackQuestions.id,
				questionText: feedbackQuestions.text,
				questionSortOrder: feedbackQuestions.sortOrder,
			})
			.from(feedbackCategories)
			.leftJoin(
				feedbackQuestions,
				eq(feedbackQuestions.categoryId, feedbackCategories.id)
			)
			.orderBy(
				asc(feedbackCategories.sortOrder),
				asc(feedbackQuestions.sortOrder)
			);

		const resultMap = new Map<string, CategoryQuestionBoard>();

		for (const row of rows) {
			const existing = resultMap.get(row.categoryId);

			if (!existing) {
				resultMap.set(row.categoryId, {
					id: row.categoryId,
					name: row.categoryName,
					sortOrder: row.categorySortOrder,
					questionCount: row.questionId ? 1 : 0,
					questions: row.questionId
						? [
								{
									id: row.questionId,
									categoryId: row.categoryId,
									text: row.questionText ?? '',
									sortOrder: row.questionSortOrder ?? 0,
								},
							]
						: [],
				});
				continue;
			}

			if (row.questionId) {
				existing.questions.push({
					id: row.questionId,
					categoryId: row.categoryId,
					text: row.questionText ?? '',
					sortOrder: row.questionSortOrder ?? 0,
				});
				existing.questionCount += 1;
			}
		}

		return Array.from(resultMap.values());
	}

	async reorderQuestions(ids: string[]) {
		await db.transaction(async (tx) => {
			for (let i = 0; i < ids.length; i++) {
				await tx
					.update(feedbackQuestions)
					.set({ sortOrder: i + 1 })
					.where(eq(feedbackQuestions.id, ids[i]));
			}
		});
	}

	async reorderCategories(ids: string[]) {
		await db.transaction(async (tx) => {
			for (let i = 0; i < ids.length; i++) {
				await tx
					.update(feedbackCategories)
					.set({ sortOrder: i + 1 })
					.where(eq(feedbackCategories.id, ids[i]));
			}
		});
	}
}

export const feedbackQuestionRepository = new FeedbackQuestionRepository();
