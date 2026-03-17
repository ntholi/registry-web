import { asc, eq } from 'drizzle-orm';
import {
	db,
	studentFeedbackCategories,
	studentFeedbackQuestions,
} from '@/core/database';
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

export default class StudentFeedbackQuestionRepository extends BaseRepository<
	typeof studentFeedbackQuestions,
	'id'
> {
	constructor() {
		super(studentFeedbackQuestions, studentFeedbackQuestions.id);
	}

	override async findById(id: string) {
		return db.query.studentFeedbackQuestions.findFirst({
			where: eq(studentFeedbackQuestions.id, id),
			with: { category: true },
		});
	}

	async findAllWithCategories() {
		return db.query.studentFeedbackQuestions.findMany({
			with: { category: true },
			orderBy: (q) => [asc(q.sortOrder)],
		});
	}

	async findQuestionBoard(): Promise<CategoryQuestionBoard[]> {
		const rows = await db
			.select({
				categoryId: studentFeedbackCategories.id,
				categoryName: studentFeedbackCategories.name,
				categorySortOrder: studentFeedbackCategories.sortOrder,
				questionId: studentFeedbackQuestions.id,
				questionText: studentFeedbackQuestions.text,
				questionSortOrder: studentFeedbackQuestions.sortOrder,
			})
			.from(studentFeedbackCategories)
			.leftJoin(
				studentFeedbackQuestions,
				eq(studentFeedbackQuestions.categoryId, studentFeedbackCategories.id)
			)
			.orderBy(
				asc(studentFeedbackCategories.sortOrder),
				asc(studentFeedbackQuestions.sortOrder)
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
					.update(studentFeedbackQuestions)
					.set({ sortOrder: i + 1 })
					.where(eq(studentFeedbackQuestions.id, ids[i]));
			}
		});
	}

	async reorderCategories(ids: string[]) {
		await db.transaction(async (tx) => {
			for (let i = 0; i < ids.length; i++) {
				await tx
					.update(studentFeedbackCategories)
					.set({ sortOrder: i + 1 })
					.where(eq(studentFeedbackCategories.id, ids[i]));
			}
		});
	}
}

export const feedbackQuestionRepository =
	new StudentFeedbackQuestionRepository();
