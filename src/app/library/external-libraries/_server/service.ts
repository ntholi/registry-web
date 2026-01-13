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
		});
	}
}

export const externalLibrariesService = serviceWrapper(
	ExternalLibraryService,
	'ExternalLibraryService'
);
