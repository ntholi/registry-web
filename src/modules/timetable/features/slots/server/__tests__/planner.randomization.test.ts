import { describe, expect, it } from 'vitest';
import type { AllocationRecord, DayOfWeek, VenueRecord } from '../planner';
import { buildTermPlan } from '../planner';

let allocationId = 50000;
let semesterModuleId = 50000;
let venueId = 50000;
let moduleId = 500000;

function nextAllocationId(): number {
	const id = allocationId;
	allocationId += 1;
	return id;
}

function nextSemesterModuleId(): number {
	const id = semesterModuleId;
	semesterModuleId += 1;
	return id;
}

function nextVenueId(): number {
	const id = venueId;
	venueId += 1;
	return id;
}

function nextModuleId(): number {
	const id = moduleId;
	moduleId += 1;
	return id;
}

function makeAllocation(
	overrides: Partial<Omit<AllocationRecord, 'semesterModule' | 'user'>> & {
		semesterModule?: {
			id?: number;
			semesterId?: number | null;
			module?: { id?: number; name?: string };
		};
		user?: {
			userSchools?: { schoolId: number }[];
		};
	} = {}
): AllocationRecord {
	const id = overrides.id ?? nextAllocationId();
	const semesterModuleIdValue =
		overrides.semesterModuleId ??
		overrides.semesterModule?.id ??
		nextSemesterModuleId();
	const moduleIdValue = overrides.semesterModule?.module?.id ?? nextModuleId();
	const moduleNameValue =
		overrides.semesterModule?.module?.name ?? `Module-${moduleIdValue}`;
	const semesterIdValue = overrides.semesterModule?.semesterId ?? null;

	const semesterModule = {
		id: overrides.semesterModule?.id ?? semesterModuleIdValue,
		semesterId: overrides.semesterModule?.semesterId ?? semesterIdValue,
		module: {
			id: moduleIdValue,
			name: moduleNameValue,
		},
	};

	const user = {
		userSchools: overrides.user?.userSchools ?? [{ schoolId: 1 }],
	};

	return {
		id,
		termId: overrides.termId ?? 1,
		userId: overrides.userId ?? `lecturer-${id}`,
		semesterModuleId: semesterModule.id,
		duration: overrides.duration ?? 120,
		numberOfStudents: overrides.numberOfStudents ?? 60,
		groupName: overrides.groupName ?? null,
		allowedDays:
			overrides.allowedDays ??
			(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[]),
		startTime: overrides.startTime ?? '08:30:00',
		endTime: overrides.endTime ?? '17:30:00',
		createdAt: overrides.createdAt ?? new Date(),
		timetableAllocationVenueTypes:
			overrides.timetableAllocationVenueTypes ?? [],
		semesterModule,
		user,
	} as AllocationRecord;
}

function makeVenue(overrides: Partial<VenueRecord> = {}): VenueRecord {
	const id = overrides.id ?? nextVenueId();
	const typeId = overrides.type?.id ?? overrides.typeId ?? 1;
	return {
		id,
		name: overrides.name ?? `Venue ${id}`,
		capacity: overrides.capacity ?? 80,
		typeId,
		createdAt: overrides.createdAt ?? new Date(),
		type: overrides.type ?? {
			id: typeId,
			name: `Type ${typeId}`,
			description: null,
			createdAt: new Date(),
		},
		venueSchools: overrides.venueSchools ?? [{ schoolId: 1 }],
	} as VenueRecord;
}

describe('buildTermPlan - Randomization Tests', () => {
	it('distributes slots randomly across multiple time slots', () => {
		const venues = [makeVenue({ capacity: 100 })];
		const timeDistribution: Record<string, number> = {};
		const dayDistribution: Record<string, number> = {};
		const iterations = 30;

		for (let i = 0; i < iterations; i++) {
			const allocations = [
				makeAllocation({
					userId: 'lecturer-1',
					semesterModule: { semesterId: 1 },
				}),
				makeAllocation({
					userId: 'lecturer-2',
					semesterModule: { semesterId: 2 },
				}),
				makeAllocation({
					userId: 'lecturer-3',
					semesterModule: { semesterId: 3 },
				}),
				makeAllocation({
					userId: 'lecturer-4',
					semesterModule: { semesterId: 4 },
				}),
				makeAllocation({
					userId: 'lecturer-5',
					semesterModule: { semesterId: 5 },
				}),
			];

			const plan = buildTermPlan(1, allocations, venues);

			for (const slot of plan) {
				timeDistribution[slot.startTime] =
					(timeDistribution[slot.startTime] || 0) + 1;
				dayDistribution[slot.dayOfWeek] =
					(dayDistribution[slot.dayOfWeek] || 0) + 1;
			}
		}

		const uniqueTimes = Object.keys(timeDistribution).length;
		const uniqueDays = Object.keys(dayDistribution).length;

		expect(uniqueTimes).toBeGreaterThan(1);
		expect(uniqueDays).toBeGreaterThan(1);

		const totalSlots = iterations * 5;
		const mostFrequentTime = Math.max(...Object.values(timeDistribution));
		const mostFrequentTimePercentage = (mostFrequentTime / totalSlots) * 100;

		expect(mostFrequentTimePercentage).toBeLessThan(80);
	});

	it('does not cluster all slots at earliest time', () => {
		const venues = [makeVenue({ capacity: 100 })];
		const iterations = 20;
		let earlyTimeCount = 0;
		let laterTimeCount = 0;

		for (let i = 0; i < iterations; i++) {
			const allocations = [
				makeAllocation({
					userId: 'lecturer-1',
					semesterModule: { semesterId: 1 },
				}),
				makeAllocation({
					userId: 'lecturer-2',
					semesterModule: { semesterId: 2 },
				}),
				makeAllocation({
					userId: 'lecturer-3',
					semesterModule: { semesterId: 3 },
				}),
			];

			const plan = buildTermPlan(1, allocations, venues);

			for (const slot of plan) {
				if (slot.startTime === '08:30:00') {
					earlyTimeCount++;
				} else {
					laterTimeCount++;
				}
			}
		}

		expect(laterTimeCount).toBeGreaterThan(0);
		expect(earlyTimeCount).toBeLessThan(iterations * 3);
	});

	it('distributes slots across multiple days when possible', () => {
		const venues = [makeVenue({ capacity: 100 }), makeVenue({ capacity: 100 })];
		const iterations = 15;
		const dayDistribution: Record<string, number> = {};

		for (let i = 0; i < iterations; i++) {
			const allocations = [
				makeAllocation({
					userId: 'lecturer-1',
					semesterModule: { semesterId: 1 },
				}),
				makeAllocation({
					userId: 'lecturer-2',
					semesterModule: { semesterId: 2 },
				}),
				makeAllocation({
					userId: 'lecturer-3',
					semesterModule: { semesterId: 3 },
				}),
				makeAllocation({
					userId: 'lecturer-4',
					semesterModule: { semesterId: 4 },
				}),
			];

			const plan = buildTermPlan(1, allocations, venues);

			for (const slot of plan) {
				dayDistribution[slot.dayOfWeek] =
					(dayDistribution[slot.dayOfWeek] || 0) + 1;
			}
		}

		const uniqueDays = Object.keys(dayDistribution).length;
		expect(uniqueDays).toBeGreaterThan(1);
	});

	it('maintains randomization across different runs', () => {
		const venues = [makeVenue({ capacity: 100 })];

		const run1TimeDistribution: Record<string, number> = {};
		const run2TimeDistribution: Record<string, number> = {};

		for (let i = 0; i < 10; i++) {
			const allocations = [
				makeAllocation({
					userId: `lecturer-${i}-1`,
					semesterModule: { semesterId: i * 10 + 1 },
				}),
				makeAllocation({
					userId: `lecturer-${i}-2`,
					semesterModule: { semesterId: i * 10 + 2 },
				}),
			];

			const plan = buildTermPlan(1, allocations, venues);

			for (const slot of plan) {
				run1TimeDistribution[slot.startTime] =
					(run1TimeDistribution[slot.startTime] || 0) + 1;
			}
		}

		for (let i = 0; i < 10; i++) {
			const allocations = [
				makeAllocation({
					userId: `lecturer-${i}-3`,
					semesterModule: { semesterId: i * 10 + 3 },
				}),
				makeAllocation({
					userId: `lecturer-${i}-4`,
					semesterModule: { semesterId: i * 10 + 4 },
				}),
			];

			const plan = buildTermPlan(1, allocations, venues);

			for (const slot of plan) {
				run2TimeDistribution[slot.startTime] =
					(run2TimeDistribution[slot.startTime] || 0) + 1;
			}
		}

		const hasVariation =
			Object.keys(run1TimeDistribution).some(
				(time) => run1TimeDistribution[time] !== run2TimeDistribution[time]
			) ||
			Object.keys(run1TimeDistribution).length !==
				Object.keys(run2TimeDistribution).length;

		expect(hasVariation).toBe(true);
	});

	it('respects venue combining priority over randomization', () => {
		const lecturerId = 'same-lecturer';
		const moduleName = 'Combined Module';
		const moduleIdValue = nextModuleId();

		const alloc1 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 120,
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
		});

		const alloc2 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 120,
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
		});

		const venues = [makeVenue({ capacity: 100 })];

		let combinedCount = 0;
		const iterations = 10;

		for (let i = 0; i < iterations; i++) {
			const plan = buildTermPlan(1, [alloc1, alloc2], venues);

			if (plan.length === 1 && plan[0].allocationIds.length === 2) {
				combinedCount++;
			}
		}

		expect(combinedCount).toBe(iterations);
	});

	it('produces varied distributions with larger datasets', () => {
		const venues = Array.from({ length: 3 }, () =>
			makeVenue({ capacity: 100 })
		);
		const timeDistribution: Record<string, number> = {};
		const iterations = 20;

		for (let i = 0; i < iterations; i++) {
			const allocations = Array.from({ length: 10 }, (_, j) =>
				makeAllocation({
					userId: `lecturer-${j}`,
					semesterModule: { semesterId: j + 1 },
					duration: 120,
				})
			);

			const plan = buildTermPlan(1, allocations, venues);

			for (const slot of plan) {
				timeDistribution[slot.startTime] =
					(timeDistribution[slot.startTime] || 0) + 1;
			}
		}

		const uniqueTimes = Object.keys(timeDistribution).length;
		expect(uniqueTimes).toBeGreaterThanOrEqual(2);

		const totalSlots = Object.values(timeDistribution).reduce(
			(sum, count) => sum + count,
			0
		);
		const averagePerTime = totalSlots / uniqueTimes;

		const hasReasonableDistribution = Object.values(timeDistribution).some(
			(count) => Math.abs(count - averagePerTime) < averagePerTime * 0.5
		);

		expect(hasReasonableDistribution).toBe(true);
	});
});
