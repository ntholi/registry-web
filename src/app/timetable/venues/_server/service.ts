import type { venues } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { VenueInsert, VenueQueryOptions } from './repository';
import VenueRepository from './repository';

class VenueService extends BaseService<typeof venues, 'id'> {
	private venueRepository: VenueRepository;

	constructor() {
		const repository = new VenueRepository();
		super(repository, {
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			createAuth: { venues: ['create'] },
			updateAuth: { venues: ['update'] },
			deleteAuth: { venues: ['delete'] },
			activityTypes: {
				create: 'venue_created',
				update: 'venue_updated',
				delete: 'venue_deleted',
			},
		});
		this.venueRepository = repository;
	}

	getWithRelations = async (id: string) => {
		return withPermission(async () => {
			return this.venueRepository.findByIdWithRelations(id);
		}, 'dashboard');
	};

	findAllWithRelations = async (options: VenueQueryOptions) => {
		return withPermission(async () => {
			return this.venueRepository.findAllWithRelations(options);
		}, 'dashboard');
	};

	getAllWithRelations = async () => {
		return withPermission(async () => {
			return this.venueRepository.getAllWithRelations();
		}, 'dashboard');
	};

	createWithSchools = async (venue: VenueInsert, schoolIds: number[]) => {
		return withPermission(
			async () => {
				return this.venueRepository.createWithSchools(venue, schoolIds);
			},
			{ venues: ['create'] }
		);
	};

	updateWithSchools = async (
		id: string,
		venue: Partial<VenueInsert>,
		schoolIds?: number[]
	) => {
		return withPermission(
			async () => {
				return this.venueRepository.updateWithSchools(id, venue, schoolIds);
			},
			{ venues: ['update'] }
		);
	};
}

export const venueService = serviceWrapper(VenueService, 'VenueService');
