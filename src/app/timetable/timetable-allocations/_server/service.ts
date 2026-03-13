import type { timetableAllocations } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
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
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			createAuth: { timetable: ['create'] },
			updateAuth: { timetable: ['update'] },
			deleteAuth: { timetable: ['delete'] },
			activityTypes: {
				create: 'allocation_created',
				update: 'allocation_updated',
				delete: 'allocation_deleted',
			},
		});
		this.repo = repository;
	}

	async getWithRelations(id: number) {
		return withPermission(async () => {
			return this.repo.findByIdWithRelations(id);
		}, 'dashboard');
	}

	async getByUserIdWithRelations(userId: string) {
		return withPermission(async () => {
			return this.repo.findByUserIdWithRelations(userId);
		}, 'dashboard');
	}

	async createWithVenueTypes(
		allocation: TimetableAllocationInsert,
		venueTypeIds: string[],
		allowedVenueIds: string[]
	) {
		return withPermission(
			async () => {
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
				return this.repo.createWithVenueTypes(
					allocation,
					venueTypeIds,
					allowedVenueIds
				);
			},
			{ timetable: ['create'] }
		);
	}

	async createManyWithVenueTypes(
		allocations: TimetableAllocationInsert[],
		venueTypeIds: string[],
		allowedVenueIds: string[]
	) {
		return withPermission(
			async () => {
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
				return this.repo.createManyWithVenueTypes(
					allocations,
					venueTypeIds,
					allowedVenueIds
				);
			},
			{ timetable: ['create'] }
		);
	}

	async create(allocation: TimetableAllocationInsert) {
		return withPermission(
			async () => {
				return this.repo.createAllocation(allocation);
			},
			{ timetable: ['create'] }
		);
	}

	async update(id: number, allocation: Partial<TimetableAllocationInsert>) {
		return withPermission(
			async () => {
				return this.repo.updateAllocation(id, allocation);
			},
			{ timetable: ['update'] }
		);
	}

	async delete(id: number) {
		return withPermission(
			async () => {
				return this.repo.deleteAllocation(id);
			},
			{ timetable: ['delete'] }
		);
	}

	async deleteMany(ids: number[]) {
		return withPermission(
			async () => {
				return this.repo.deleteAllocations(ids);
			},
			{ timetable: ['delete'] }
		);
	}

	async updateVenueTypes(allocationId: number, venueTypeIds: string[]) {
		return withPermission(
			async () => {
				await this.repo.updateVenueTypes(allocationId, venueTypeIds);
			},
			{ timetable: ['update'] }
		);
	}

	async updateAllowedVenues(allocationId: number, venueIds: string[]) {
		return withPermission(
			async () => {
				await this.repo.updateAllowedVenues(allocationId, venueIds);
			},
			{ timetable: ['update'] }
		);
	}

	async setOverflowVenue(allocationId: number, venueId: string) {
		return withPermission(
			async () => {
				await this.repo.setOverflowVenue(allocationId, venueId);
			},
			{ timetable: ['update'] }
		);
	}
}

export const timetableAllocationService = serviceWrapper(
	TimetableAllocationService,
	'TimetableAllocationService'
);
