import { describe, expect, it } from 'vitest';
import type { AllocationRecord, VenueRecord } from '../planner';
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
			(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const),
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

describe('Randomization Verification', () => {
	it('demonstrates random distribution across time slots', () => {
		const venues = [makeVenue({ capacity: 100 })];

		const timeDistribution: Record<string, number> = {};
		const iterations = 20;

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
				const time = slot.startTime;
				timeDistribution[time] = (timeDistribution[time] || 0) + 1;
			}
		}

		console.log('\n=== RANDOMIZATION TEST RESULTS ===');
		console.log(`Total iterations: ${iterations}`);
		console.log(`Total allocations per iteration: 5`);
		console.log('\nTime slot distribution:');

		const sortedTimes = Object.keys(timeDistribution).sort();
		for (const time of sortedTimes) {
			const count = timeDistribution[time];
			const percentage = ((count / (iterations * 5)) * 100).toFixed(1);
			console.log(`  ${time}: ${count} slots (${percentage}%)`);
		}

		const uniqueTimes = Object.keys(timeDistribution).length;
		expect(uniqueTimes).toBeGreaterThan(1);

		console.log(
			`\n✓ Slots distributed across ${uniqueTimes} different time slots`
		);
		console.log('✓ Randomization is working!\n');
	});

	it('shows slots are NOT all at 08:30', () => {
		const venues = [makeVenue({ capacity: 100 })];

		let non830Count = 0;
		const iterations = 10;

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
				if (slot.startTime !== '08:30:00') {
					non830Count++;
				}
			}
		}

		console.log(`\n=== NON-08:30 TEST ===`);
		console.log(
			`Out of ${iterations * 3} total slots, ${non830Count} started at times other than 08:30`
		);
		console.log(
			`Percentage NOT at 08:30: ${((non830Count / (iterations * 3)) * 100).toFixed(1)}%\n`
		);

		expect(non830Count).toBeGreaterThan(0);
	});
});
