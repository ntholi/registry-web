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
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
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
