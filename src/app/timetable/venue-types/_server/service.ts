import type { venueTypes } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import VenueTypeRepository from './repository';

class VenueTypeService extends BaseService<typeof venueTypes, 'id'> {
	private repo: VenueTypeRepository;

	constructor() {
		const repository = new VenueTypeRepository();
		super(repository, {
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			createAuth: { venues: ['create'] },
			updateAuth: { venues: ['update'] },
			deleteAuth: { venues: ['delete'] },
			activityTypes: {
				create: 'venue_type_created',
				update: 'venue_type_updated',
				delete: 'venue_type_deleted',
			},
		});
		this.repo = repository;
	}

	async getAll() {
		return withPermission(async () => {
			return this.repo.findAll();
		}, 'dashboard');
	}
}

export const venueTypeService = serviceWrapper(
	VenueTypeService,
	'VenueTypeService'
);
