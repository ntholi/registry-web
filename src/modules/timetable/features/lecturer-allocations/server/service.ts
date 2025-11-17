import type { lecturerAllocations } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { LecturerAllocationInsert } from './repository';
import LecturerAllocationRepository from './repository';

class LecturerAllocationService extends BaseService<
	typeof lecturerAllocations,
	'id'
> {
	private repo: LecturerAllocationRepository;

	constructor() {
		const repository = new LecturerAllocationRepository();
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
		allocation: LecturerAllocationInsert,
		venueTypeIds: number[]
	) {
		return withAuth(async () => {
			return this.repo.createWithVenueTypes(allocation, venueTypeIds);
		}, ['academic']);
	}

	async createManyWithVenueTypes(
		allocations: LecturerAllocationInsert[],
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

export const lecturerAllocationService = serviceWrapper(
	LecturerAllocationService,
	'LecturerAllocationService'
);
