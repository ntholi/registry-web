import type { venueTypes } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import VenueTypeRepository from './repository';

class VenueTypeService extends BaseService<typeof venueTypes, 'id'> {
	private repo: VenueTypeRepository;

	constructor() {
		const repository = new VenueTypeRepository();
		super(repository, {
			createRoles: ['academic', 'registry'],
			updateRoles: ['academic', 'registry'],
			deleteRoles: ['academic', 'registry'],
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			activityTypes: {
				create: 'venue_type_created',
				update: 'venue_type_updated',
			},
		});
		this.repo = repository;
	}

	async getAll() {
		return withAuth(async () => {
			return this.repo.findAll();
		}, ['dashboard']);
	}
}

export const venueTypeService = serviceWrapper(
	VenueTypeService,
	'VenueTypeService'
);
