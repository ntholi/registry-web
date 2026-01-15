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
		venueTypeIds: string[]
	) {
		return withAuth(async () => {
			const duplicate = await this.repo.findDuplicate(
				allocation.semesterModuleId,
				allocation.termId,
				allocation.classType,
				allocation.groupName
			);
			if (duplicate) {
				const groupInfo = allocation.groupName
					? `Group ${allocation.groupName}`
					: 'All Students';
				throw new Error(
					`This class (${groupInfo}) has already been allocated for this module in the current term. Each class can only have one ${allocation.classType} allocation per module.`
				);
			}
			return this.repo.createWithVenueTypes(allocation, venueTypeIds);
		}, ['academic']);
	}

	async createManyWithVenueTypes(
		allocations: TimetableAllocationInsert[],
		venueTypeIds: string[]
	) {
		return withAuth(async () => {
			for (const allocation of allocations) {
				const duplicate = await this.repo.findDuplicate(
					allocation.semesterModuleId,
					allocation.termId,
					allocation.classType,
					allocation.groupName
				);
				if (duplicate) {
					const groupInfo = allocation.groupName
						? `Group ${allocation.groupName}`
						: 'All Students';
					throw new Error(
						`The class (${groupInfo}) has already been allocated for this module in the current term. Each class can only have one ${allocation.classType} allocation per module.`
					);
				}
			}
			return this.repo.createManyWithVenueTypes(allocations, venueTypeIds);
		}, ['academic']);
	}

	async create(allocation: TimetableAllocationInsert) {
		return withAuth(async () => {
			return this.repo.createAllocation(allocation);
		}, ['academic']);
	}

	async update(id: number, allocation: Partial<TimetableAllocationInsert>) {
		return withAuth(async () => {
			return this.repo.updateAllocation(id, allocation);
		}, ['academic']);
	}

	async delete(id: number) {
		return withAuth(async () => {
			return this.repo.deleteAllocation(id);
		}, ['academic']);
	}

	async updateVenueTypes(allocationId: number, venueTypeIds: string[]) {
		return withAuth(async () => {
			await this.repo.updateVenueTypes(allocationId, venueTypeIds);
		}, ['academic']);
	}
}

export const timetableAllocationService = serviceWrapper(
	TimetableAllocationService,
	'TimetableAllocationService'
);
