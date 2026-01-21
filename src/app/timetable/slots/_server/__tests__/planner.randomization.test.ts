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

function nextVenueId(): string {
	const id = `venue-${venueId}`;
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
			module?: { id?: number; code?: string; name?: string };
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
	const moduleCodeValue =
		overrides.semesterModule?.module?.code ?? `MOD-${moduleIdValue}`;
	const moduleNameValue =
		overrides.semesterModule?.module?.name ?? `Module-${moduleIdValue}`;
	const semesterIdValue = overrides.semesterModule?.semesterId ?? null;

	const semesterModule = {
		id: overrides.semesterModule?.id ?? semesterModuleIdValue,
		semesterId: overrides.semesterModule?.semesterId ?? semesterIdValue,
		module: {
			id: moduleIdValue,
			code: moduleCodeValue,
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
	const typeId = overrides.type?.id ?? overrides.typeId ?? `type-1`;
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
		const earliestTime = '08:30:00';
		const laterTimeCount = totalSlots - (timeDistribution[earliestTime] ?? 0);

		expect(mostFrequentTimePercentage).toBeLessThan(80);
		expect(laterTimeCount).toBeGreaterThan(0);
	});

	it('maintains randomization across different runs', () => {
		const venues = [makeVenue({ capacity: 100 }), makeVenue({ capacity: 100 })];

		const run1TimeDistribution: Record<string, number> = {};
		const run2TimeDistribution: Record<string, number> = {};

		for (let i = 0; i < 20; i++) {
			const allocations = [
				makeAllocation({
					userId: `lecturer-${i}-1`,
					semesterModule: { semesterId: i * 10 + 1 },
				}),
				makeAllocation({
					userId: `lecturer-${i}-2`,
					semesterModule: { semesterId: i * 10 + 2 },
				}),
				makeAllocation({
					userId: `lecturer-${i}-3`,
					semesterModule: { semesterId: i * 10 + 3 },
				}),
			];

			const plan = buildTermPlan(1, allocations, venues);

			for (const slot of plan) {
				run1TimeDistribution[slot.startTime] =
					(run1TimeDistribution[slot.startTime] || 0) + 1;
			}
		}

		for (let i = 0; i < 20; i++) {
			const allocations = [
				makeAllocation({
					userId: `lecturer-${i}-4`,
					semesterModule: { semesterId: i * 10 + 4 },
				}),
				makeAllocation({
					userId: `lecturer-${i}-5`,
					semesterModule: { semesterId: i * 10 + 5 },
				}),
				makeAllocation({
					userId: `lecturer-${i}-6`,
					semesterModule: { semesterId: i * 10 + 6 },
				}),
			];

			const plan = buildTermPlan(1, allocations, venues);

			for (const slot of plan) {
				run2TimeDistribution[slot.startTime] =
					(run2TimeDistribution[slot.startTime] || 0) + 1;
			}
		}

		const run1Times = Object.keys(run1TimeDistribution).length;
		const run2Times = Object.keys(run2TimeDistribution).length;

		expect(run1Times).toBeGreaterThan(1);
		expect(run2Times).toBeGreaterThan(1);
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
