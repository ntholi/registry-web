import type { timetableAllocations } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { TimetableAllocationInsert } from './repository';
import TimetableAllocationRepository from './repository';

class TimetableAllocationService extends BaseService<
	typeof timetableAllocations,
	'id'
> {
	private repo: TimetableAllocationRepository;

	constructor() {
		const repository = new TimetableAllocationRepository();
		super(repository, {
			createRoles: ['academic'],
			updateRoles: ['academic'],
			deleteRoles: ['academic'],
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
		});
		this.repo = repository;
	}

	async getWithRelations(id: number) {
		return withAuth(async () => {
			return this.repo.findByIdWithRelations(id);
		}, ['dashboard']);
	}

	async getByUserIdWithRelations(userId: string) {
		return withAuth(async () => {
			return this.repo.findByUserIdWithRelations(userId);
		}, ['dashboard']);
	}

	async createWithVenueTypes(
		allocation: TimetableAllocationInsert,
		venueTypeIds: number[]
	) {
		return withAuth(async () => {
			return this.repo.createWithVenueTypes(allocation, venueTypeIds);
		}, ['academic']);
	}

	async createManyWithVenueTypes(
		allocations: TimetableAllocationInsert[],
		venueTypeIds: number[]
	) {
		return withAuth(async () => {
			const created = [];
			for (const allocation of allocations) {
				const result = await this.repo.createWithVenueTypes(
					allocation,
					venueTypeIds
				);
				created.push(result);
			}
			return created;
		}, ['academic']);
	}

	async updateVenueTypes(allocationId: number, venueTypeIds: number[]) {
		return withAuth(async () => {
			return this.repo.updateVenueTypes(allocationId, venueTypeIds);
		}, ['academic']);
	}
}

export const timetableAllocationService = serviceWrapper(
	TimetableAllocationService,
	'TimetableAllocationService'
);
