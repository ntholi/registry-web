import { asc, eq } from 'drizzle-orm';
import { db, feedbackCategories, feedbackQuestions } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

interface QuestionBoardRow {
	categoryId: number;
	categoryName: string;
	questionId: number | null;
	questionText: string | null;
}

interface CategoryQuestionBoard {
	id: number;
	name: string;
	questionCount: number;
	questions: Array<{
		id: number;
		categoryId: number;
		text: string;
	}>;
}

export default class FeedbackQuestionRepository extends BaseRepository<
	typeof feedbackQuestions,
	'id'
> {
	constructor() {
		super(feedbackQuestions, feedbackQuestions.id);
	}

	override async findById(id: number) {
		return db.query.feedbackQuestions.findFirst({
			where: eq(feedbackQuestions.id, id),
			with: { category: true },
		});
	}

	async findAllWithCategories() {
		return db.query.feedbackQuestions.findMany({
			with: { category: true },
			orderBy: (q, { desc }) => [desc(q.createdAt)],
		});
	}

	async findQuestionBoard(): Promise<CategoryQuestionBoard[]> {
		const rows = await db
			.select({
				categoryId: feedbackCategories.id,
				categoryName: feedbackCategories.name,
				questionId: feedbackQuestions.id,
				questionText: feedbackQuestions.text,
			})
			.from(feedbackCategories)
			.leftJoin(
				feedbackQuestions,
				eq(feedbackQuestions.categoryId, feedbackCategories.id)
			)
			.orderBy(asc(feedbackCategories.name), asc(feedbackQuestions.createdAt));

		const resultMap = new Map<number, CategoryQuestionBoard>();

		for (const row of rows as QuestionBoardRow[]) {
			const existing = resultMap.get(row.categoryId);

			if (!existing) {
				resultMap.set(row.categoryId, {
					id: row.categoryId,
					name: row.categoryName,
					questionCount: row.questionId ? 1 : 0,
					questions: row.questionId
						? [
								{
									id: row.questionId,
									categoryId: row.categoryId,
									text: row.questionText ?? '',
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
				});
				existing.questionCount += 1;
			}
		}

		return Array.from(resultMap.values());
	}
}

export const feedbackQuestionRepository = new FeedbackQuestionRepository();
