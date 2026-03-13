import type { feedbackCategories } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import FeedbackCategoryRepository from './repository';

class FeedbackCategoryService extends BaseService<
	typeof feedbackCategories,
	'id'
> {
	constructor() {
		super(new FeedbackCategoryRepository(), {
			findAllAuth: { 'feedback-categories': ['read'] },
			byIdAuth: { 'feedback-categories': ['read'] },
			createAuth: { 'feedback-categories': ['create'] },
			updateAuth: { 'feedback-categories': ['update'] },
			deleteAuth: { 'feedback-categories': ['delete'] },
			activityTypes: {
				create: 'feedback_category_created',
				update: 'feedback_category_updated',
				delete: 'feedback_category_deleted',
			},
		});
	}

	override async delete(id: string) {
		return withPermission(
			async (session) => {
				const repo = this.repository as FeedbackCategoryRepository;
				const hasQuestions = await repo.hasQuestions(id);

				if (hasQuestions) {
					throw new Error(
						'Category cannot be deleted because it contains questions'
					);
				}

				const audit = this.buildAuditOptions(session, 'delete');
				await repo.delete(id, audit);
			},
			{ 'feedback-categories': ['delete'] }
		);
	}
}

export const feedbackCategoriesService = serviceWrapper(
	FeedbackCategoryService,
	'FeedbackCategoriesService'
);
