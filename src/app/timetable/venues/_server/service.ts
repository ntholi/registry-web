import type { venues } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { VenueInsert, VenueQueryOptions } from './repository';
import VenueRepository from './repository';

class VenueService extends BaseService<typeof venues, 'id'> {
	private venueRepository: VenueRepository;

	constructor() {
		const repository = new VenueRepository();
		super(repository, {
			createRoles: ['academic', 'registry'],
			updateRoles: ['academic', 'registry'],
			deleteRoles: ['academic', 'registry'],
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
		});
		this.venueRepository = repository;
	}

	getWithRelations = async (id: string) => {
		return withAuth(async () => {
			return this.venueRepository.findByIdWithRelations(id);
		}, ['dashboard']);
	};

	findAllWithRelations = async (options: VenueQueryOptions) => {
		return withAuth(async () => {
			return this.venueRepository.findAllWithRelations(options);
		}, ['dashboard']);
	};

	createWithSchools = async (venue: VenueInsert, schoolIds: number[]) => {
		return withAuth(async () => {
			return this.venueRepository.createWithSchools(venue, schoolIds);
		}, ['academic', 'registry']);
	};

	updateWithSchools = async (
		id: string,
		venue: Partial<VenueInsert>,
		schoolIds?: number[]
	) => {
		return withAuth(async () => {
			return this.venueRepository.updateWithSchools(id, venue, schoolIds);
		}, []);
	};
}

export const venueService = serviceWrapper(VenueService, 'VenueService');
