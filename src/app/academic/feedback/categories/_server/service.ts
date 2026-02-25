import type { feedbackCategories } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import FeedbackCategoryRepository from './repository';

class FeedbackCategoryService extends BaseService<
	typeof feedbackCategories,
	'id'
> {
	constructor() {
		super(new FeedbackCategoryRepository(), {
			findAllRoles: ['academic', 'admin'],
			byIdRoles: ['academic', 'admin'],
			createRoles: ['academic', 'admin'],
			updateRoles: ['academic', 'admin'],
			deleteRoles: ['academic', 'admin'],
			activityTypes: {
				create: 'feedback_category_created',
				update: 'feedback_category_updated',
				delete: 'feedback_category_deleted',
			},
		});
	}

	override async delete(id: string) {
		return withAuth(async () => {
			const repo = this.repository as FeedbackCategoryRepository;
			const hasQuestions = await repo.hasQuestions(id);

			if (hasQuestions) {
				throw new Error(
					'Category cannot be deleted because it contains questions'
				);
			}

			await repo.delete(id);
		}, ['academic', 'admin']);
	}
}

export const feedbackCategoriesService = serviceWrapper(
	FeedbackCategoryService,
	'FeedbackCategoriesService'
);
