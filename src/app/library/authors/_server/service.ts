import type { authors } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import AuthorRepository from './repository';

class AuthorService extends BaseService<typeof authors, 'id'> {
	constructor() {
		super(new AuthorRepository(), {
			byIdAuth: { library: ['read'] },
			findAllAuth: { library: ['read'] },
			createAuth: { library: ['create'] },
			updateAuth: { library: ['update'] },
			deleteAuth: { library: ['delete'] },
			activityTypes: {
				create: 'author_created',
				update: 'author_updated',
				delete: 'author_deleted',
			},
		});
	}
}

export const authorsService = serviceWrapper(AuthorService, 'AuthorService');
