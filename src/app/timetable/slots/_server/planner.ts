import { config } from '@/config';
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
		semesterId: number | null;
		module: {
			id: number;
			name: string;
		};
	};
	user: {
		userSchools: {
			schoolId: number;
		}[];
	};
};

export type VenueRecord = typeof venues.$inferSelect & {
	type: typeof venueTypes.$inferSelect;
	venueSchools: {
		schoolId: number;
	}[];
};

interface PlanSlot {
	key: string;
	venueId: number;
	dayOfWeek: DayOfWeek;
	startMinutes: number;
	endMinutes: number;
	capacityUsed: number;
	allocationIds: Set<number>;
	lecturerIds: Set<string>;
	semesterIds: Set<number>;
	moduleName: string;
	semesterModuleId: number;
	classType: string;
}

interface LecturerSchedule {
	lecturerId: string;
	slotsByDay: Map<DayOfWeek, PlanSlot[]>;
}

interface ClassSchedule {
	semesterId: number;
	slotsByDay: Map<DayOfWeek, PlanSlot[]>;
}

interface PlanningState {
	slots: Map<string, PlanSlot>;
	daySchedules: Map<string, PlanSlot[]>;
	lecturerSchedules: Map<string, LecturerSchedule>;
	classSchedules: Map<number, ClassSchedule>;
	venueLoad: Map<number, number>;
	allocationPlacements: Map<number, string>;
	maxSlotsPerDay: number;
}

interface PlacementCandidate {
	score: number;
	slotKey: string;
	isNew: boolean;
	canCombine: boolean;
	venueId: number;
	dayOfWeek: DayOfWeek;
	startMinutes: number;
	endMinutes: number;
	violations: string[];
}

interface ConstraintCheck {
	valid: boolean;
	reason?: string;
}

const MAX_CONSECUTIVE_SLOTS = 2;
const MAX_BACKTRACK_ATTEMPTS = 50;

function generateValidStartTimes(
	allocation: AllocationRecord,
	windowStart: number,
	windowEnd: number
): number[] {
	const validTimes: number[] = [];
	const baseStartMinutes = toMinutes(
		config.timetable.timetableAllocations.startTime
	);
	const configDuration = config.timetable.timetableAllocations.duration;

	let candidateTime = baseStartMinutes;

	while (candidateTime < windowEnd) {
		if (
			candidateTime >= windowStart &&
			candidateTime + allocation.duration <= windowEnd
		) {
			validTimes.push(candidateTime);
		}
		candidateTime += configDuration;
	}

	return validTimes;
}

export function buildTermPlan(
	termId: number,
	allocations: AllocationRecord[],
	venues: VenueRecord[],
	maxSlotsPerDay?: number
): PlannedSlotInput[] {
	const planningState: PlanningState = {
		slots: new Map(),
		daySchedules: new Map(),
		lecturerSchedules: new Map(),
		classSchedules: new Map(),
		venueLoad: new Map(),
		allocationPlacements: new Map(),
		maxSlotsPerDay:
			maxSlotsPerDay ?? config.timetable.timetableAllocations.maxSlotsPerDay,
	};

	const sortedAllocations = sortAllocationsByConstraints(allocations);

	let placementAttempts = 0;
	const maxAttempts = sortedAllocations.length * 2;

	for (const allocation of sortedAllocations) {
		placementAttempts++;

		if (placementAttempts > maxAttempts) {
			throw new Error(
				'Maximum placement attempts exceeded - constraints may be too restrictive'
			);
		}

		const placed = attemptPlaceAllocation(
			allocation,
			venues,
			planningState,
			allocations
		);

		if (!placed) {
			throw new Error(
				`Unable to allocate slot for allocation ${allocation.id} with provided constraints. Try relaxing constraints or adding more venues/time slots.`
			);
		}
	}

	validateFinalPlan(planningState, allocations);

	return convertPlanToOutput(termId, planningState);
}

function sortAllocationsByConstraints(
	allocations: AllocationRecord[]
): AllocationRecord[] {
	return [...allocations].sort((a, b) => {
		const scoreA = computeConstraintScore(a);
		const scoreB = computeConstraintScore(b);
		if (scoreA !== scoreB) {
			return scoreB - scoreA;
		}

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
	});
}

function computeConstraintScore(allocation: AllocationRecord): number {
	let score = 0;

	score += allocation.timetableAllocationVenueTypes.length > 0 ? 10 : 0;

	const timeWindow =
		toMinutes(allocation.endTime) - toMinutes(allocation.startTime);
	if (timeWindow <= allocation.duration + 60) {
		score += 5;
	}

	score += Math.max(0, 5 - allocation.allowedDays.length);

	const capacity = allocation.numberOfStudents ?? 0;
	if (capacity > 100) {
		score += 3;
	}

	return score;
}

function computeFlexibility(allocation: AllocationRecord): number {
	const windowMinutes =
		toMinutes(allocation.endTime) - toMinutes(allocation.startTime);
	const dayFactor = allocation.allowedDays.length || 1;
	return windowMinutes * dayFactor - allocation.duration;
}

function attemptPlaceAllocation(
	allocation: AllocationRecord,
	venues: VenueRecord[],
	planningState: PlanningState,
	allAllocations: AllocationRecord[],
	recursionDepth: number = 0
): boolean {
	if (recursionDepth > 5) {
		return false;
	}

	const candidates = collectCandidateVenues(allocation, venues);

	if (candidates.length === 0) {
		return false;
	}

	const allPlacements: PlacementCandidate[] = [];

	for (const venue of candidates) {
		for (const day of allocation.allowedDays) {
			const placements = evaluateAllPlacements(
				allocation,
				venue,
				day,
				planningState
			);
			allPlacements.push(...placements);
		}
	}

	const validPlacements = allPlacements.filter(
		(p) => p.violations.length === 0
	);

	if (validPlacements.length > 0) {
		const combinedPlacements = validPlacements.filter((p) => p.canCombine);

		if (combinedPlacements.length > 0) {
			combinedPlacements.sort((a, b) => a.score - b.score);
			applyPlacement(allocation, combinedPlacements[0], planningState);
			return true;
		}

		const newPlacements = validPlacements.filter((p) => !p.canCombine);
		newPlacements.sort((a, b) => a.score - b.score);

		const topScoreThreshold = newPlacements[0].score + 200;
		const topPlacements = newPlacements.filter(
			(p) => p.score <= topScoreThreshold
		);

		const randomIndex = Math.floor(Math.random() * topPlacements.length);
		const selected = topPlacements[randomIndex];

		applyPlacement(allocation, selected, planningState);
		return true;
	}

	const relaxedConsecutivePlacements = allPlacements.filter((p) =>
		p.violations.every((v) => v.includes('consecutive'))
	);

	if (relaxedConsecutivePlacements.length > 0) {
		relaxedConsecutivePlacements.sort((a, b) => a.score - b.score);
		const best = relaxedConsecutivePlacements[0];
		applyPlacement(allocation, best, planningState);
		return true;
	}

	const relaxedMaxSlotsPlacements = allPlacements.filter((p) =>
		p.violations.every(
			(v) => v.includes('consecutive') || v.includes('Max slots per day')
		)
	);

	if (relaxedMaxSlotsPlacements.length > 0) {
		relaxedMaxSlotsPlacements.sort((a, b) => a.score - b.score);
		const best = relaxedMaxSlotsPlacements[0];
		applyPlacement(allocation, best, planningState);
		return true;
	}

	const backtrackResult = tryLocalReallocation(
		allocation,
		venues,
		planningState,
		allAllocations,
		recursionDepth + 1
	);

	if (backtrackResult) {
		return true;
	}

	if (allPlacements.length > 0) {
		allPlacements.sort((a, b) => a.score - b.score);
		const best = allPlacements[0];
		applyPlacement(allocation, best, planningState);
		return true;
	}

	return false;
}

function tryLocalReallocation(
	allocation: AllocationRecord,
	venues: VenueRecord[],
	planningState: PlanningState,
	allAllocations: AllocationRecord[],
	recursionDepth: number = 0
): boolean {
	if (recursionDepth > 5) {
		return false;
	}

	const recentAllocations = allAllocations
		.filter((a) => planningState.allocationPlacements.has(a.id))
		.slice(-MAX_BACKTRACK_ATTEMPTS);

	for (const recentAlloc of recentAllocations) {
		const oldPlacementKey = planningState.allocationPlacements.get(
			recentAlloc.id
		);
		if (!oldPlacementKey) {
			continue;
		}

		const backupState = clonePlanningState(planningState);

		removePlacement(recentAlloc.id, planningState);

		const newPlaced = attemptPlaceAllocation(
			allocation,
			venues,
			planningState,
			allAllocations,
			recursionDepth + 1
		);

		if (newPlaced) {
			const recentPlaced = attemptPlaceAllocation(
				recentAlloc,
				venues,
				planningState,
				allAllocations,
				recursionDepth + 1
			);

			if (recentPlaced) {
				return true;
			}
		}

		restorePlanningState(backupState, planningState);
	}

	return false;
}

function collectCandidateVenues(
	allocation: AllocationRecord,
	venues: VenueRecord[]
): VenueRecord[] {
	const requiredCapacity = allocation.numberOfStudents ?? 0;
	const requiredTypes = allocation.timetableAllocationVenueTypes.map(
		(item) => item.venueTypeId
	);
	const lecturerSchoolIds = allocation.user.userSchools.map(
		(us) => us.schoolId
	);

	const candidates: VenueRecord[] = [];

	for (const venue of venues) {
		if (requiredTypes.length > 0 && !requiredTypes.includes(venue.typeId)) {
			continue;
		}

		const maxCapacity = Math.floor(venue.capacity * 1.1);
		if (requiredCapacity > maxCapacity) {
			continue;
		}

		const venueSchoolIds = venue.venueSchools.map((vs) => vs.schoolId);
		const hasCommonSchool = lecturerSchoolIds.some((schoolId) =>
			venueSchoolIds.includes(schoolId)
		);

		if (!hasCommonSchool) {
			continue;
		}

		candidates.push(venue);
	}

	candidates.sort((a, b) => {
		const capacityDiffA = Math.abs(a.capacity - requiredCapacity);
		const capacityDiffB = Math.abs(b.capacity - requiredCapacity);
		return capacityDiffA - capacityDiffB;
	});

	return candidates;
}

function evaluateAllPlacements(
	allocation: AllocationRecord,
	venue: VenueRecord,
	day: DayOfWeek,
	planningState: PlanningState
): PlacementCandidate[] {
	const placements: PlacementCandidate[] = [];

	const combinableSlot = findCombinableSlot(
		allocation,
		venue,
		day,
		planningState
	);

	if (combinableSlot) {
		const constraintCheck = validatePlacement(
			allocation,
			combinableSlot.venueId,
			combinableSlot.dayOfWeek,
			combinableSlot.startMinutes,
			combinableSlot.endMinutes,
			false,
			planningState
		);

		const score = computePlacementScore({
			allocation,
			startMinutes: combinableSlot.startMinutes,
			venueLoad: planningState.venueLoad.get(venue.id) ?? 0,
			dayLoad: (
				planningState.daySchedules.get(buildDayKey(venue.id, day)) ?? []
			).length,
			venue,
			isCombined: true,
			violationCount: constraintCheck.valid ? 0 : 1,
		});

		placements.push({
			score,
			slotKey: combinableSlot.key,
			isNew: false,
			canCombine: true,
			venueId: venue.id,
			dayOfWeek: day,
			startMinutes: combinableSlot.startMinutes,
			endMinutes: combinableSlot.endMinutes,
			violations: constraintCheck.valid ? [] : [constraintCheck.reason || ''],
		});
	}

	const windows = findAvailableTimeWindows(
		allocation,
		venue,
		day,
		planningState
	);

	const validStartTimes: number[] = [];
	for (const window of windows) {
		const timesInWindow = generateValidStartTimes(
			allocation,
			window.start,
			window.end
		);
		validStartTimes.push(...timesInWindow);
	}

	for (const start of validStartTimes) {
		const end = start + allocation.duration;

		const constraintCheck = validatePlacement(
			allocation,
			venue.id,
			day,
			start,
			end,
			true,
			planningState
		);

		const score = computePlacementScore({
			allocation,
			startMinutes: start,
			venueLoad: planningState.venueLoad.get(venue.id) ?? 0,
			dayLoad: (
				planningState.daySchedules.get(buildDayKey(venue.id, day)) ?? []
			).length,
			venue,
			isCombined: false,
			violationCount: constraintCheck.valid ? 0 : 1,
		});

		placements.push({
			score,
			slotKey: buildSlotKey(venue.id, day, start, end),
			isNew: true,
			canCombine: false,
			venueId: venue.id,
			dayOfWeek: day,
			startMinutes: start,
			endMinutes: end,
			violations: constraintCheck.valid ? [] : [constraintCheck.reason || ''],
		});
	}

	return placements;
}

function findCombinableSlot(
	allocation: AllocationRecord,
	venue: VenueRecord,
	day: DayOfWeek,
	planningState: PlanningState
): PlanSlot | null {
	const dayKey = buildDayKey(venue.id, day);
	const daySlots = planningState.daySchedules.get(dayKey) ?? [];

	const earliestStart = toMinutes(allocation.startTime);
	const latestEnd = toMinutes(allocation.endTime);

	for (const slot of daySlots) {
		if (
			slot.moduleName !== allocation.semesterModule.module.name ||
			!slot.lecturerIds.has(allocation.userId) ||
			slot.classType !== allocation.classType
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
		const newCapacity = slot.capacityUsed + (allocation.numberOfStudents ?? 0);
		if (newCapacity > maxCapacity) {
			continue;
		}

		return slot;
	}

	return null;
}

function findAvailableTimeWindows(
	allocation: AllocationRecord,
	venue: VenueRecord,
	day: DayOfWeek,
	planningState: PlanningState
): Array<{ start: number; end: number }> {
	const dayKey = buildDayKey(venue.id, day);
	const daySlots = planningState.daySchedules.get(dayKey) ?? [];

	const earliestStart = toMinutes(allocation.startTime);
	const latestEnd = toMinutes(allocation.endTime);
	const duration = allocation.duration;

	const windows: Array<{ start: number; end: number }> = [];
	const latestStart = latestEnd - duration;

	if (latestStart < earliestStart) {
		return windows;
	}

	let cursor = earliestStart;
	const sortedSlots = [...daySlots].sort(
		(a, b) => a.startMinutes - b.startMinutes
	);

	for (const slot of sortedSlots) {
		if (slot.startMinutes > cursor) {
			const windowStart = cursor;
			const windowEnd = Math.min(slot.startMinutes, latestStart + duration);

			if (windowEnd - windowStart >= duration) {
				windows.push({ start: windowStart, end: windowEnd });
			}
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

function validatePlacement(
	allocation: AllocationRecord,
	_venueId: number,
	day: DayOfWeek,
	startMinutes: number,
	endMinutes: number,
	isNewSlot: boolean,
	planningState: PlanningState
): ConstraintCheck {
	if (!isNewSlot) {
		return { valid: true };
	}

	const lecturerCheck = checkLecturerConflicts(
		allocation,
		day,
		startMinutes,
		endMinutes,
		planningState
	);
	if (!lecturerCheck.valid) {
		return lecturerCheck;
	}

	const classCheck = checkClassConflicts(
		allocation,
		day,
		startMinutes,
		endMinutes,
		planningState
	);
	if (!classCheck.valid) {
		return classCheck;
	}

	const consecutiveCheckLecturer = checkConsecutiveSlots(
		allocation.userId,
		day,
		startMinutes,
		endMinutes,
		planningState.lecturerSchedules.get(allocation.userId),
		'lecturer'
	);
	if (!consecutiveCheckLecturer.valid) {
		return consecutiveCheckLecturer;
	}

	const semesterId = allocation.semesterModule.semesterId;
	if (semesterId !== null) {
		const consecutiveCheckClass = checkConsecutiveSlots(
			String(semesterId),
			day,
			startMinutes,
			endMinutes,
			planningState.classSchedules.get(semesterId),
			'class'
		);
		if (!consecutiveCheckClass.valid) {
			return consecutiveCheckClass;
		}
	}

	const maxSlotsCheckLecturer = checkMaxSlotsPerDay(
		allocation.userId,
		day,
		planningState.lecturerSchedules.get(allocation.userId),
		planningState.maxSlotsPerDay,
		'lecturer'
	);
	if (!maxSlotsCheckLecturer.valid) {
		return maxSlotsCheckLecturer;
	}

	if (semesterId !== null) {
		const maxSlotsCheckClass = checkMaxSlotsPerDay(
			String(semesterId),
			day,
			planningState.classSchedules.get(semesterId),
			planningState.maxSlotsPerDay,
			'class'
		);
		if (!maxSlotsCheckClass.valid) {
			return maxSlotsCheckClass;
		}
	}

	return { valid: true };
}

function checkLecturerConflicts(
	allocation: AllocationRecord,
	day: DayOfWeek,
	startMinutes: number,
	endMinutes: number,
	planningState: PlanningState
): ConstraintCheck {
	const lecturerSchedule = planningState.lecturerSchedules.get(
		allocation.userId
	);

	if (!lecturerSchedule) {
		return { valid: true };
	}

	const daySlots = lecturerSchedule.slotsByDay.get(day) ?? [];

	for (const slot of daySlots) {
		const overlaps =
			(startMinutes >= slot.startMinutes && startMinutes < slot.endMinutes) ||
			(endMinutes > slot.startMinutes && endMinutes <= slot.endMinutes) ||
			(startMinutes <= slot.startMinutes && endMinutes >= slot.endMinutes);

		if (overlaps) {
			if (slot.moduleName !== allocation.semesterModule.module.name) {
				return {
					valid: false,
					reason: `Lecturer conflict: lecturer has another module at this time`,
				};
			}

			if (slot.classType !== allocation.classType) {
				return {
					valid: false,
					reason: `Lecturer conflict: lecturer cannot have different class types (${slot.classType} and ${allocation.classType}) at overlapping times`,
				};
			}
		}
	}

	return { valid: true };
}

function checkClassConflicts(
	allocation: AllocationRecord,
	day: DayOfWeek,
	startMinutes: number,
	endMinutes: number,
	planningState: PlanningState
): ConstraintCheck {
	const semesterId = allocation.semesterModule.semesterId;

	if (semesterId === null) {
		return { valid: true };
	}

	const classSchedule = planningState.classSchedules.get(semesterId);

	if (!classSchedule) {
		return { valid: true };
	}

	const daySlots = classSchedule.slotsByDay.get(day) ?? [];

	for (const slot of daySlots) {
		const overlaps =
			(startMinutes >= slot.startMinutes && startMinutes < slot.endMinutes) ||
			(endMinutes > slot.startMinutes && endMinutes <= slot.endMinutes) ||
			(startMinutes <= slot.startMinutes && endMinutes >= slot.endMinutes);

		if (overlaps) {
			return {
				valid: false,
				reason: `Class conflict: class has another module at this time`,
			};
		}
	}

	return { valid: true };
}

function checkConsecutiveSlots(
	_entityId: string,
	day: DayOfWeek,
	startMinutes: number,
	endMinutes: number,
	schedule: LecturerSchedule | ClassSchedule | undefined,
	entityType: 'lecturer' | 'class'
): ConstraintCheck {
	if (!schedule) {
		return { valid: true };
	}

	const daySlots = schedule.slotsByDay.get(day) ?? [];

	if (daySlots.length === 0) {
		return { valid: true };
	}

	const sortedSlots = [...daySlots].sort(
		(a, b) => a.startMinutes - b.startMinutes
	);

	let consecutiveCount = 0;

	for (const slot of sortedSlots) {
		if (slot.startMinutes <= startMinutes) {
			if (slot.endMinutes === startMinutes) {
				consecutiveCount++;
			} else if (slot.endMinutes < startMinutes) {
				consecutiveCount = 0;
			}
		}
	}

	if (consecutiveCount >= MAX_CONSECUTIVE_SLOTS) {
		return {
			valid: false,
			reason: `Consecutive slots violation: ${entityType} would have ${consecutiveCount + 1} consecutive slots`,
		};
	}

	consecutiveCount = 0;
	for (const slot of sortedSlots) {
		if (slot.startMinutes >= endMinutes) {
			if (slot.startMinutes === endMinutes) {
				consecutiveCount++;
			} else {
				break;
			}
		}
	}

	if (consecutiveCount >= MAX_CONSECUTIVE_SLOTS) {
		return {
			valid: false,
			reason: `Consecutive slots violation: ${entityType} would have ${consecutiveCount + 1} consecutive slots`,
		};
	}

	return { valid: true };
}

function checkMaxSlotsPerDay(
	_entityId: string,
	day: DayOfWeek,
	schedule: LecturerSchedule | ClassSchedule | undefined,
	maxSlots: number,
	entityType: 'lecturer' | 'class'
): ConstraintCheck {
	if (!schedule) {
		return { valid: true };
	}

	const daySlots = schedule.slotsByDay.get(day) ?? [];

	if (daySlots.length >= maxSlots) {
		return {
			valid: false,
			reason: `Max slots per day exceeded: ${entityType} already has ${daySlots.length} slots on ${day}`,
		};
	}

	return { valid: true };
}

function computePlacementScore(params: {
	allocation: AllocationRecord;
	startMinutes: number;
	venueLoad: number;
	dayLoad: number;
	venue: VenueRecord;
	isCombined: boolean;
	violationCount: number;
}): number {
	const baseStart = toMinutes(params.allocation.startTime);
	const timePenalty = Math.max(0, params.startMinutes - baseStart);

	const loadPenalty = params.venueLoad * 10 + params.dayLoad * 3;

	const capacity = params.venue.capacity;
	const required = params.allocation.numberOfStudents ?? 0;
	const capacityDiff = Math.abs(capacity - required);
	const capacityPenalty = (capacityDiff / Math.max(capacity, 1)) * 30;

	const combinationBonus = params.isCombined ? -50 : 0;

	const violationPenalty = params.violationCount * 1000;

	return (
		timePenalty +
		loadPenalty +
		capacityPenalty +
		combinationBonus +
		violationPenalty
	);
}

function applyPlacement(
	allocation: AllocationRecord,
	placement: PlacementCandidate,
	planningState: PlanningState
): void {
	const students = allocation.numberOfStudents ?? 0;
	const semesterId = allocation.semesterModule.semesterId;

	if (placement.isNew) {
		const slot: PlanSlot = {
			key: placement.slotKey,
			venueId: placement.venueId,
			dayOfWeek: placement.dayOfWeek,
			startMinutes: placement.startMinutes,
			endMinutes: placement.endMinutes,
			capacityUsed: students,
			allocationIds: new Set([allocation.id]),
			lecturerIds: new Set([allocation.userId]),
			semesterIds: new Set(semesterId !== null ? [semesterId] : []),
			moduleName: allocation.semesterModule.module.name,
			semesterModuleId: allocation.semesterModuleId,
			classType: allocation.classType,
		};

		planningState.slots.set(slot.key, slot);

		const dayKey = buildDayKey(slot.venueId, slot.dayOfWeek);
		const daySlots = planningState.daySchedules.get(dayKey) ?? [];
		daySlots.push(slot);
		daySlots.sort((a, b) => a.startMinutes - b.startMinutes);
		planningState.daySchedules.set(dayKey, daySlots);

		const load = planningState.venueLoad.get(slot.venueId) ?? 0;
		planningState.venueLoad.set(slot.venueId, load + 1);

		updateScheduleTracking(slot, allocation, planningState);
	} else {
		const existing = planningState.slots.get(placement.slotKey);
		if (!existing) {
			throw new Error('Slot state out of sync');
		}

		existing.capacityUsed += students;
		existing.allocationIds.add(allocation.id);
		existing.lecturerIds.add(allocation.userId);
		if (semesterId !== null) {
			existing.semesterIds.add(semesterId);
		}
	}

	planningState.allocationPlacements.set(allocation.id, placement.slotKey);
}

function updateScheduleTracking(
	slot: PlanSlot,
	allocation: AllocationRecord,
	planningState: PlanningState
): void {
	let lecturerSchedule = planningState.lecturerSchedules.get(allocation.userId);
	if (!lecturerSchedule) {
		lecturerSchedule = {
			lecturerId: allocation.userId,
			slotsByDay: new Map(),
		};
		planningState.lecturerSchedules.set(allocation.userId, lecturerSchedule);
	}

	const lecturerDaySlots =
		lecturerSchedule.slotsByDay.get(slot.dayOfWeek) ?? [];
	lecturerDaySlots.push(slot);
	lecturerDaySlots.sort((a, b) => a.startMinutes - b.startMinutes);
	lecturerSchedule.slotsByDay.set(slot.dayOfWeek, lecturerDaySlots);

	const semesterId = allocation.semesterModule.semesterId;
	if (semesterId !== null) {
		let classSchedule = planningState.classSchedules.get(semesterId);
		if (!classSchedule) {
			classSchedule = {
				semesterId,
				slotsByDay: new Map(),
			};
			planningState.classSchedules.set(semesterId, classSchedule);
		}

		const classDaySlots = classSchedule.slotsByDay.get(slot.dayOfWeek) ?? [];
		classDaySlots.push(slot);
		classDaySlots.sort((a, b) => a.startMinutes - b.startMinutes);
		classSchedule.slotsByDay.set(slot.dayOfWeek, classDaySlots);
	}
}

function removePlacement(
	allocationId: number,
	planningState: PlanningState
): void {
	const slotKey = planningState.allocationPlacements.get(allocationId);
	if (!slotKey) {
		return;
	}

	const slot = planningState.slots.get(slotKey);
	if (!slot) {
		return;
	}

	slot.allocationIds.delete(allocationId);

	if (slot.allocationIds.size === 0) {
		planningState.slots.delete(slotKey);

		const dayKey = buildDayKey(slot.venueId, slot.dayOfWeek);
		const daySlots = planningState.daySchedules.get(dayKey) ?? [];
		const filtered = daySlots.filter((s) => s.key !== slotKey);
		planningState.daySchedules.set(dayKey, filtered);

		const load = planningState.venueLoad.get(slot.venueId) ?? 0;
		planningState.venueLoad.set(slot.venueId, Math.max(0, load - 1));

		for (const schedule of planningState.lecturerSchedules.values()) {
			for (const [day, slots] of schedule.slotsByDay.entries()) {
				const filtered = slots.filter((s) => s.key !== slotKey);
				schedule.slotsByDay.set(day, filtered);
			}
		}

		for (const schedule of planningState.classSchedules.values()) {
			for (const [day, slots] of schedule.slotsByDay.entries()) {
				const filtered = slots.filter((s) => s.key !== slotKey);
				schedule.slotsByDay.set(day, filtered);
			}
		}
	}

	planningState.allocationPlacements.delete(allocationId);
}

function clonePlanningState(state: PlanningState): PlanningState {
	const cloned: PlanningState = {
		slots: new Map(),
		daySchedules: new Map(),
		lecturerSchedules: new Map(),
		classSchedules: new Map(),
		venueLoad: new Map(state.venueLoad),
		allocationPlacements: new Map(state.allocationPlacements),
		maxSlotsPerDay: state.maxSlotsPerDay,
	};

	for (const [key, slot] of state.slots.entries()) {
		cloned.slots.set(key, {
			...slot,
			allocationIds: new Set(slot.allocationIds),
			lecturerIds: new Set(slot.lecturerIds),
			semesterIds: new Set(slot.semesterIds),
		});
	}

	for (const [key, slots] of state.daySchedules.entries()) {
		cloned.daySchedules.set(key, [...slots]);
	}

	for (const [key, schedule] of state.lecturerSchedules.entries()) {
		const newSchedule: LecturerSchedule = {
			lecturerId: schedule.lecturerId,
			slotsByDay: new Map(),
		};
		for (const [day, slots] of schedule.slotsByDay.entries()) {
			newSchedule.slotsByDay.set(day, [...slots]);
		}
		cloned.lecturerSchedules.set(key, newSchedule);
	}

	for (const [key, schedule] of state.classSchedules.entries()) {
		const newSchedule: ClassSchedule = {
			semesterId: schedule.semesterId,
			slotsByDay: new Map(),
		};
		for (const [day, slots] of schedule.slotsByDay.entries()) {
			newSchedule.slotsByDay.set(day, [...slots]);
		}
		cloned.classSchedules.set(key, newSchedule);
	}

	return cloned;
}

function restorePlanningState(
	backup: PlanningState,
	target: PlanningState
): void {
	target.slots = backup.slots;
	target.daySchedules = backup.daySchedules;
	target.lecturerSchedules = backup.lecturerSchedules;
	target.classSchedules = backup.classSchedules;
	target.venueLoad = backup.venueLoad;
	target.allocationPlacements = backup.allocationPlacements;
	target.maxSlotsPerDay = backup.maxSlotsPerDay;
}

function validateFinalPlan(
	planningState: PlanningState,
	allocations: AllocationRecord[]
): void {
	for (const allocation of allocations) {
		if (!planningState.allocationPlacements.has(allocation.id)) {
			throw new Error(
				`Validation failed: allocation ${allocation.id} was not placed`
			);
		}
	}

	for (const slot of planningState.slots.values()) {
		if (slot.allocationIds.size === 0) {
			throw new Error(`Validation failed: slot ${slot.key} has no allocations`);
		}
	}
}

function convertPlanToOutput(
	termId: number,
	planningState: PlanningState
): PlannedSlotInput[] {
	const results: PlannedSlotInput[] = [];

	for (const slot of planningState.slots.values()) {
		results.push({
			termId,
			venueId: slot.venueId,
			dayOfWeek: slot.dayOfWeek,
			startTime: minutesToTime(slot.startMinutes),
			endTime: minutesToTime(slot.endMinutes),
			capacityUsed: slot.capacityUsed,
			allocationIds: Array.from(slot.allocationIds),
		});
	}

	return results;
}

function buildDayKey(venueId: number, day: DayOfWeek): string {
	return `${venueId}-${day}`;
}

function buildSlotKey(
	venueId: number,
	day: DayOfWeek,
	start: number,
	end: number
): string {
	return `${venueId}-${day}-${start}-${end}`;
}

function toMinutes(time: string): number {
	const [hours, minutes] = time.split(':');
	const parsedHours = Number(hours);
	const parsedMinutes = Number(minutes);
	return parsedHours * 60 + parsedMinutes;
}

function minutesToTime(minutesValue: number): string {
	const minutes = Math.max(0, minutesValue);
	const hoursPart = Math.floor(minutes / 60) % 24;
	const minutesPart = minutes % 60;
	const hoursText = hoursPart.toString().padStart(2, '0');
	const minutesText = minutesPart.toString().padStart(2, '0');
	return `${hoursText}:${minutesText}:00`;
}
