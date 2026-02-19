import { count, eq } from 'drizzle-orm';
import { db, feedbackCategories, feedbackQuestions } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class FeedbackCategoryRepository extends BaseRepository<
	typeof feedbackCategories,
	'id'
> {
	constructor() {
		super(feedbackCategories, feedbackCategories.id);
	}

	async hasQuestions(id: string): Promise<boolean> {
		const [result] = await db
			.select({ count: count() })
			.from(feedbackQuestions)
			.where(eq(feedbackQuestions.categoryId, id));

		return (result?.count ?? 0) > 0;
	}
}

export const feedbackCategoryRepository = new FeedbackCategoryRepository();
