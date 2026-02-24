import type { categories } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import CategoryRepository from './repository';

class CategoryService extends BaseService<typeof categories, 'id'> {
	constructor() {
		super(new CategoryRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
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
