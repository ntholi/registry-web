import { count, eq } from 'drizzle-orm';
import {
	db,
	studentFeedbackCategories,
	studentFeedbackQuestions,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class StudentFeedbackCategoryRepository extends BaseRepository<
	typeof studentFeedbackCategories,
	'id'
> {
	constructor() {
		super(studentFeedbackCategories, studentFeedbackCategories.id);
	}

	async hasQuestions(id: string): Promise<boolean> {
		const [result] = await db
			.select({ count: count() })
			.from(studentFeedbackQuestions)
			.where(eq(studentFeedbackQuestions.categoryId, id));

		return (result?.count ?? 0) > 0;
	}
}

export const feedbackCategoryRepository =
	new StudentFeedbackCategoryRepository();
