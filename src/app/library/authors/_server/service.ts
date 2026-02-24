import type { authors } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import AuthorRepository from './repository';

class AuthorService extends BaseService<typeof authors, 'id'> {
	constructor() {
		super(new AuthorRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
			activityTypes: {
				create: 'author_created',
				update: 'author_updated',
				delete: 'author_deleted',
			},
		});
	}
}

export const authorsService = serviceWrapper(AuthorService, 'AuthorService');
