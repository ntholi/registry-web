import { eq } from 'drizzle-orm';
import { db, feedbackQuestions } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

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
}

export const feedbackQuestionRepository = new FeedbackQuestionRepository();
