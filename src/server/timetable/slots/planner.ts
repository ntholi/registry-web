import type {
	timetableAllocations,
	timetableSlots,
	venues,
	venueTypes,
} from '@/core/database';
import type { PlannedSlotInput } from './repository';

export type DayOfWeek = (typeof timetableSlots.dayOfWeek.enumValues)[number];

export type AllocationRecord = typeof timetableAllocations.$inferSelect & {
	timetableAllocationVenueTypes: {
		venueTypeId: number;
	}[];
	semesterModule: {
		id: number;
		module: {
			id: number;
		};
	};
};

export type VenueRecord = typeof venues.$inferSelect & {
	type: typeof venueTypes.$inferSelect;
};

interface PlanSlot {
	key: string;
	venueId: number;
	dayOfWeek: DayOfWeek;
	startMinutes: number;
	endMinutes: number;
	capacityUsed: number;
	allocationIds: number[];
	moduleId: number;
	semesterModuleId: number;
}

interface PlanningState {
	slots: Map<string, PlanSlot>;
	daySchedules: Map<string, PlanSlot[]>;
	venueLoad: Map<number, number>;
}

interface PlacementCandidate {
	score: number;
	slotKey: string;
	isNew: boolean;
	venueId: number;
	dayOfWeek: DayOfWeek;
	startMinutes: number;
	endMinutes: number;
}

const TIME_STEP_MINUTES = 5;

export function buildTermPlan(
	termId: number,
	allocations: AllocationRecord[],
	venues: VenueRecord[]
): PlannedSlotInput[] {
	const planningState: PlanningState = {
		slots: new Map(),
		daySchedules: new Map(),
		venueLoad: new Map(),
	};
	const sortedAllocations = [...allocations].sort((a, b) =>
		compareAllocations(a, b)
	);
	for (const allocation of sortedAllocations) {
		placeAllocation(allocation, venues, planningState);
	}
	const results: PlannedSlotInput[] = [];
	for (const slot of planningState.slots.values()) {
		results.push({
			termId,
			venueId: slot.venueId,
			dayOfWeek: slot.dayOfWeek,
			startTime: minutesToTime(slot.startMinutes),
			endTime: minutesToTime(slot.endMinutes),
			capacityUsed: slot.capacityUsed,
			allocationIds: [...slot.allocationIds],
		});
	}
	return results;
}

function compareAllocations(a: AllocationRecord, b: AllocationRecord) {
	const flexA = computeFlexibility(a);
	const flexB = computeFlexibility(b);
	if (flexA !== flexB) {
		return flexA - flexB;
	}
	const studentsA = a.numberOfStudents ?? 0;
	const studentsB = b.numberOfStudents ?? 0;
	if (studentsA !== studentsB) {
		return studentsB - studentsA;
	}
	return a.id - b.id;
}

function computeFlexibility(allocation: AllocationRecord) {
	const windowMinutes =
		toMinutes(allocation.endTime) - toMinutes(allocation.startTime);
	const dayFactor = allocation.allowedDays.length || 1;
	return windowMinutes * dayFactor - allocation.duration;
}

function placeAllocation(
	allocation: AllocationRecord,
	venues: VenueRecord[],
	planningState: PlanningState
) {
	const candidates = collectCandidateVenues(allocation, venues);
	let bestPlacement: PlacementCandidate | null = null;
	for (const candidate of candidates) {
		for (const day of allocation.allowedDays) {
			const proposal = evaluateDayPlacement(
				allocation,
				candidate,
				day,
				planningState
			);
			if (
				proposal &&
				(bestPlacement === null || proposal.score < bestPlacement.score)
			) {
				bestPlacement = proposal;
			}
		}
	}
	if (!bestPlacement) {
		throw new Error('Unable to allocate slot with provided constraints');
	}
	applyPlacement(allocation, bestPlacement, planningState);
}

function collectCandidateVenues(
	allocation: AllocationRecord,
	venues: VenueRecord[]
) {
	const requiredCapacity = allocation.numberOfStudents ?? 0;
	const requiredTypes = allocation.timetableAllocationVenueTypes.map(
		(item: { venueTypeId: number }) => item.venueTypeId
	);
	const results: VenueRecord[] = [];
	for (const venue of venues) {
		if (requiredTypes.length > 0 && !requiredTypes.includes(venue.typeId)) {
			continue;
		}
		const maxCapacity = Math.floor(venue.capacity * 1.1);
		if (requiredCapacity > maxCapacity) {
			continue;
		}
		results.push(venue);
	}
	return results;
}

function evaluateDayPlacement(
	allocation: AllocationRecord,
	venue: VenueRecord,
	day: DayOfWeek,
	planningState: PlanningState
) {
	const dayKey = buildDayKey(venue.id, day);
	const daySlots = planningState.daySchedules.get(dayKey) ?? [];
	const earliestStart = toMinutes(allocation.startTime);
	const latestEnd = toMinutes(allocation.endTime);
	const combinable = findCombinableSlot(
		allocation,
		venue,
		daySlots,
		earliestStart,
		latestEnd
	);
	if (combinable) {
		const startMinutes = combinable.startMinutes;
		const score = computePlacementScore({
			startMinutes,
			baseStart: earliestStart,
			venueLoad: planningState.venueLoad.get(venue.id) ?? 0,
			dayLoad: daySlots.length,
			capacity: venue.capacity,
			projectedCapacity:
				combinable.capacityUsed + (allocation.numberOfStudents ?? 0),
			isCombined: true,
		});
		return {
			score,
			slotKey: combinable.key,
			isNew: false,
			venueId: venue.id,
			dayOfWeek: day,
			startMinutes,
			endMinutes: combinable.endMinutes,
		};
	}
	const windows = buildFreeWindows(
		daySlots,
		earliestStart,
		latestEnd,
		allocation.duration
	);
	let bestWindow: {
		score: number;
		startMinutes: number;
		endMinutes: number;
	} | null = null;
	for (const window of windows) {
		let start = window.start;
		while (start + allocation.duration <= window.end) {
			const end = start + allocation.duration;
			const score = computePlacementScore({
				startMinutes: start,
				baseStart: earliestStart,
				venueLoad: planningState.venueLoad.get(venue.id) ?? 0,
				dayLoad: daySlots.length,
				capacity: venue.capacity,
				projectedCapacity: allocation.numberOfStudents ?? 0,
				isCombined: false,
			});
			if (!bestWindow || score < bestWindow.score) {
				bestWindow = {
					score,
					startMinutes: start,
					endMinutes: end,
				};
			}
			start += TIME_STEP_MINUTES;
		}
	}
	if (!bestWindow) {
		return null;
	}
	return {
		score: bestWindow.score,
		slotKey: buildSlotKey(
			venue.id,
			day,
			bestWindow.startMinutes,
			bestWindow.endMinutes
		),
		isNew: true,
		venueId: venue.id,
		dayOfWeek: day,
		startMinutes: bestWindow.startMinutes,
		endMinutes: bestWindow.endMinutes,
	};
}


function findCombinableSlot(
	allocation: AllocationRecord,
	venue: VenueRecord,
	daySlots: PlanSlot[],
	earliestStart: number,
	latestEnd: number
) {
	for (const slot of daySlots) {
		if (
			slot.moduleId !== allocation.semesterModule.module.id &&
			slot.semesterModuleId !== allocation.semesterModuleId
		) {
			continue;
		}
		if (slot.startMinutes < earliestStart || slot.endMinutes > latestEnd) {
			continue;
		}
		if (slot.endMinutes - slot.startMinutes !== allocation.duration) {
			continue;
		}
		const maxCapacity = Math.floor(venue.capacity * 1.1);
		if (slot.capacityUsed + (allocation.numberOfStudents ?? 0) > maxCapacity) {
			continue;
		}
		return slot;
	}
	return null;
}

function buildFreeWindows(
	daySlots: PlanSlot[],
	earliestStart: number,
	latestEnd: number,
	duration: number
) {
	const windows: { start: number; end: number }[] = [];
	const latestStart = latestEnd - duration;
	if (latestStart < earliestStart) {
		return windows;
	}
	let cursor = earliestStart;
	const sortedSlots = [...daySlots].sort(
		(a, b) => a.startMinutes - b.startMinutes
	);
	for (const slot of sortedSlots) {
		if (slot.startMinutes > cursor && slot.startMinutes - cursor >= duration) {
			const windowEnd = Math.min(slot.startMinutes, latestStart + duration);
			windows.push({ start: cursor, end: windowEnd });
		}
		if (slot.endMinutes > cursor) {
			cursor = slot.endMinutes;
		}
	}
	if (cursor <= latestStart) {
		windows.push({ start: cursor, end: latestStart + duration });
	}
	return windows;
}

function computePlacementScore(params: {
	startMinutes: number;
	baseStart: number;
	venueLoad: number;
	dayLoad: number;
	capacity: number;
	projectedCapacity: number;
	isCombined: boolean;
}) {
	const timePenalty = Math.max(0, params.startMinutes - params.baseStart);
	const loadPenalty = params.venueLoad * 15 + params.dayLoad * 5;
	const capacityRatio =
		params.capacity === 0
			? 0
			: Math.abs(params.capacity - params.projectedCapacity) / params.capacity;
	const capacityPenalty = capacityRatio * 50;
	const combinationBonus = params.isCombined ? -40 : 0;
	return timePenalty + loadPenalty + capacityPenalty + combinationBonus;
}

function applyPlacement(
	allocation: AllocationRecord,
	placement: PlacementCandidate,
	planningState: PlanningState
) {
	const students = allocation.numberOfStudents ?? 0;
	if (placement.isNew) {
		const slot: PlanSlot = {
			key: placement.slotKey,
			venueId: placement.venueId,
			dayOfWeek: placement.dayOfWeek,
			startMinutes: placement.startMinutes,
			endMinutes: placement.endMinutes,
			capacityUsed: students,
			allocationIds: [allocation.id],
			moduleId: allocation.semesterModule.module.id,
			semesterModuleId: allocation.semesterModuleId,
		};
		planningState.slots.set(slot.key, slot);
		const dayKey = buildDayKey(slot.venueId, slot.dayOfWeek);
		const daySlots = planningState.daySchedules.get(dayKey) ?? [];
		daySlots.push(slot);
		daySlots.sort((a, b) => a.startMinutes - b.startMinutes);
		planningState.daySchedules.set(dayKey, daySlots);
		const load = planningState.venueLoad.get(slot.venueId) ?? 0;
		planningState.venueLoad.set(slot.venueId, load + 1);
		return;
	}
	const existing = planningState.slots.get(placement.slotKey);
	if (!existing) {
		throw new Error('Slot state out of sync');
	}
	existing.capacityUsed += students;
	existing.allocationIds.push(allocation.id);
}

function buildDayKey(venueId: number, day: DayOfWeek) {
	return `${venueId}-${day}`;
}

function buildSlotKey(
	venueId: number,
	day: DayOfWeek,
	start: number,
	end: number
) {
	return `${venueId}-${day}-${start}-${end}`;
}

function toMinutes(time: string) {
	const [hours, minutes] = time.split(':');
	const parsedHours = Number(hours);
	const parsedMinutes = Number(minutes);
	return parsedHours * 60 + parsedMinutes;
}

function minutesToTime(minutesValue: number) {
	const minutes = Math.max(0, minutesValue);
	const hoursPart = Math.floor(minutes / 60) % 24;
	const minutesPart = minutes % 60;
	const hoursText = hoursPart.toString().padStart(2, '0');
	const minutesText = minutesPart.toString().padStart(2, '0');
	return `${hoursText}:${minutesText}:00`;
}
