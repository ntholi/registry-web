import type { timetableSlots } from '@/core/database';
import { db } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import {
	type AllocationRecord,
	buildTermPlan,
	type VenueRecord,
} from './planner';
import TimetableSlotRepository from './repository';

class TimetableSlotService extends BaseService<typeof timetableSlots, 'id'> {
	private readonly slotRepository: TimetableSlotRepository;

	constructor() {
		const slotRepository = new TimetableSlotRepository();
		super(slotRepository, {
			createRoles: ['academic', 'registry'],
			updateRoles: ['academic', 'registry'],
			deleteRoles: ['academic', 'registry'],
			findAllRoles: ['dashboard'],
			byIdRoles: ['dashboard'],
		});
		this.slotRepository = slotRepository;
	}

	async listTermSlots(termId: number) {
		return withAuth(async () => {
			return this.slotRepository.findSlotsForTerm(termId);
		}, ['dashboard']);
	}

	async getUserSlots(userId: string, termId: number) {
		return withAuth(async () => {
			return this.slotRepository.findUserSlotsForTerm(userId, termId);
		}, ['dashboard']);
	}

	async allocateSlot(allocationId: number) {
		return withAuth(async () => {
			const allocation = await this.loadAllocation(allocationId);
			return this.planAndPersist(allocation.termId);
		}, ['academic', 'registry']);
	}

	async rebuildTermSlots(termId: number) {
		return withAuth(async () => {
			return this.planAndPersist(termId);
		}, ['academic', 'registry']);
	}

	private async planAndPersist(termId: number) {
		const termAllocations = await this.fetchTermAllocations(termId);
		if (termAllocations.length === 0) {
			await this.slotRepository.replaceTermSlots(termId, []);
			return [];
		}
		const venues = await this.fetchVenues();
		if (venues.length === 0) {
			throw new Error('No venues are available for timetable planning');
		}
		const plan = buildTermPlan(termId, termAllocations, venues);
		await this.slotRepository.replaceTermSlots(termId, plan);
		return plan;
	}

	private async loadAllocation(allocationId: number) {
		const allocation = await db.query.timetableAllocations.findFirst({
			where: (tbl, { eq }) => eq(tbl.id, allocationId),
			with: {
				timetableAllocationVenueTypes: true,
				semesterModule: {
					with: {
						module: true,
					},
				},
			},
		});
		if (!allocation) {
			throw new Error('Allocation not found');
		}
		return allocation as AllocationRecord;
	}

	private async fetchTermAllocations(termId: number) {
		const allocations = await db.query.timetableAllocations.findMany({
			where: (tbl, { eq }) => eq(tbl.termId, termId),
			with: {
				timetableAllocationVenueTypes: true,
				semesterModule: {
					with: {
						module: true,
					},
				},
			},
		});
		return allocations as AllocationRecord[];
	}

	private async fetchVenues() {
		const venues = await db.query.venues.findMany({
			with: {
				type: true,
			},
		});
		return venues as VenueRecord[];
	}
}

export const timetableSlotService = serviceWrapper(
	TimetableSlotService,
	'TimetableSlotService'
);
