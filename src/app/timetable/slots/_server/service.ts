import type { timetableAllocations, timetableSlots } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { buildTermPlan, type DayOfWeek } from './planner';
import TimetableSlotRepository from './repository';

type AllocationInsert = typeof timetableAllocations.$inferInsert;

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

	async createAllocationWithSlot(
		allocation: AllocationInsert,
		slot: {
			venueId: number;
			dayOfWeek: DayOfWeek;
			startTime: string;
			endTime: string;
		}
	) {
		return withAuth(async () => {
			return this.slotRepository.createAllocationWithSlot(allocation, slot);
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
		return this.slotRepository.findAllocationRecordById(allocationId);
	}

	private async fetchTermAllocations(termId: number) {
		return this.slotRepository.findTermAllocationRecords(termId);
	}

	private async fetchVenues() {
		return this.slotRepository.findVenueRecords();
	}
}

export const timetableSlotService = serviceWrapper(
	TimetableSlotService,
	'TimetableSlotService'
);
