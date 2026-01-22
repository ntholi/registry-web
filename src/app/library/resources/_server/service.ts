import type { libraryResources } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import type { ResourceType } from '../_lib/types';
import ResourceRepository from './repository';

class ResourceService extends BaseService<typeof libraryResources, 'id'> {
	declare repository: ResourceRepository;

	constructor() {
		super(new ResourceRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
		});
	}

	async getWithRelations(id: number) {
		return this.repository.findByIdWithRelations(id);
	}

	async findByType(type: ResourceType) {
		return this.repository.findByType(type);
	}

	async search(query: string, type?: ResourceType) {
		return this.repository.search(query, type);
	}

	async getResources(page: number, search: string, type?: ResourceType) {
		return this.repository.getResourcesWithFilters(page, search, type);
	}
}

export const resourcesService = serviceWrapper(
	ResourceService,
	'ResourceService'
);
