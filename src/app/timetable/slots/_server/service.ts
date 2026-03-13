import type { timetableAllocations, timetableSlots } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import { buildTermPlan, type DayOfWeek } from './planner';
import TimetableSlotRepository from './repository';

type AllocationInsert = typeof timetableAllocations.$inferInsert;

class TimetableSlotService extends BaseService<typeof timetableSlots, 'id'> {
	private readonly slotRepository: TimetableSlotRepository;

	constructor() {
		const slotRepository = new TimetableSlotRepository();
		super(slotRepository, {
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			createAuth: { timetable: ['create'] },
			updateAuth: { timetable: ['update'] },
			deleteAuth: { timetable: ['delete'] },
			activityTypes: {
				create: 'slot_created',
				update: 'slot_updated',
				delete: 'slot_deleted',
			},
		});
		this.slotRepository = slotRepository;
	}

	async listTermSlots(termId: number) {
		return withPermission(async () => {
			return this.slotRepository.findSlotsForTerm(termId);
		}, 'dashboard');
	}

	async getUserSlots(userId: string, termId: number) {
		return withPermission(async () => {
			return this.slotRepository.findUserSlotsForTerm(userId, termId);
		}, 'dashboard');
	}

	async allocateSlot(allocationId: number) {
		return withPermission(
			async () => {
				const allocation = await this.loadAllocation(allocationId);
				return this.planAndPersist(allocation.termId);
			},
			{ timetable: ['update'] }
		);
	}

	async rebuildTermSlots(termId: number) {
		return withPermission(
			async () => {
				return this.planAndPersist(termId);
			},
			{ timetable: ['update'] }
		);
	}

	async createAllocationsWithSlots(
		items: Array<{
			allocation: AllocationInsert;
			slot: {
				venueId: string;
				dayOfWeek: DayOfWeek;
				startTime: string;
				endTime: string;
				allowOverflow?: boolean;
			};
		}>
	) {
		return withPermission(
			async () => {
				return this.slotRepository.createAllocationsWithSlots(items);
			},
			{ timetable: ['create'] }
		);
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
