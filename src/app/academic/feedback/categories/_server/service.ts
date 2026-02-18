import type { feedbackCategories } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
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
		});
	}
}

export const feedbackCategoriesService = serviceWrapper(
	FeedbackCategoryService,
	'FeedbackCategoriesService'
);
