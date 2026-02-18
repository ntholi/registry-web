import { feedbackCategories } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class FeedbackCategoryRepository extends BaseRepository<
	typeof feedbackCategories,
	'id'
> {
	constructor() {
		super(feedbackCategories, feedbackCategories.id);
	}
}

export const feedbackCategoryRepository = new FeedbackCategoryRepository();
