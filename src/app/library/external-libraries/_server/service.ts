import type { externalLibraries } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import ExternalLibraryRepository from './repository';

class ExternalLibraryService extends BaseService<
	typeof externalLibraries,
	'id'
> {
	declare repository: ExternalLibraryRepository;

	constructor() {
		super(new ExternalLibraryRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
			activityTypes: {
				create: 'external_library_added',
				update: 'external_library_updated',
				delete: 'external_library_deleted',
			},
		});
	}
}

export const externalLibrariesService = serviceWrapper(
	ExternalLibraryService,
	'ExternalLibraryService'
);
