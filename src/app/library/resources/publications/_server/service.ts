import type { publications } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { PublicationType } from '../_schema/publications';
import PublicationRepository from './repository';

class PublicationService extends BaseService<typeof publications, 'id'> {
	declare repository: PublicationRepository;

	constructor() {
		super(new PublicationRepository(), {
			byIdAuth: { library: ['read'] },
			findAllAuth: { library: ['read'] },
			createAuth: { library: ['create'] },
			updateAuth: { library: ['update'] },
			deleteAuth: { library: ['delete'] },
			activityTypes: {
				create: 'publication_added',
				update: 'publication_updated',
				delete: 'publication_deleted',
			},
		});
	}

	async getWithRelations(id: string) {
		return withPermission(() => this.repository.findByIdWithRelations(id), {
			library: ['read'],
		});
	}

	async getPublications(page: number, search: string, type?: PublicationType) {
		return withPermission(
			() => this.repository.getPublicationsWithFilters(page, search, type),
			{ library: ['read'] }
		);
	}
}

export const publicationsService = serviceWrapper(
	PublicationService,
	'PublicationService'
);
