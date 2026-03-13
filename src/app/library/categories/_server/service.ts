import type { categories } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import CategoryRepository from './repository';

class CategoryService extends BaseService<typeof categories, 'id'> {
	constructor() {
		super(new CategoryRepository(), {
			byIdAuth: { library: ['read'] },
			findAllAuth: { library: ['read'] },
			createAuth: { library: ['create'] },
			updateAuth: { library: ['update'] },
			deleteAuth: { library: ['delete'] },
			activityTypes: {
				create: 'category_created',
				update: 'category_updated',
				delete: 'category_deleted',
			},
		});
	}
}

export const categoriesService = serviceWrapper(
	CategoryService,
	'CategoryService'
);
