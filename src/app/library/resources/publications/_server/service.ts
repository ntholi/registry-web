import type { publications } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import type { PublicationType } from '../_schema/publications';
import PublicationRepository from './repository';

class PublicationService extends BaseService<typeof publications, 'id'> {
	declare repository: PublicationRepository;

	constructor() {
		super(new PublicationRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['admin', 'library'],
			updateRoles: ['admin', 'library'],
			deleteRoles: ['admin', 'library'],
			activityTypes: {
				create: 'publication_added',
				update: 'publication_updated',
				delete: 'publication_deleted',
			},
		});
	}

	async getWithRelations(id: string) {
		return this.repository.findByIdWithRelations(id);
	}

	async getPublications(page: number, search: string, type?: PublicationType) {
		return this.repository.getPublicationsWithFilters(page, search, type);
	}
}

export const publicationsService = serviceWrapper(
	PublicationService,
	'PublicationService'
);
