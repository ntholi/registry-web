import { describe, expect, it } from 'vitest';
import type { AllocationRecord, DayOfWeek, VenueRecord } from '../planner';
import { buildTermPlan } from '../planner';

let allocationId = 10000;
let semesterModuleId = 10000;
let semesterId = 10000;
let venueId = 10000;
let moduleId = 100000;

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

function nextSemesterId(): number {
	const id = semesterId;
	semesterId += 1;
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
		allowedDays: overrides.allowedDays ?? (['monday'] as DayOfWeek[]),
		startTime: overrides.startTime ?? '08:00:00',
		endTime: overrides.endTime ?? '18:00:00',
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

function timeToMinutes(time: string): number {
	const [hours, minutes] = time.split(':');
	return Number(hours) * 60 + Number(minutes);
}

describe('RUTHLESS STRESS TESTS - Venue Sharing', () => {
	it('allows venue sharing for same module + same lecturer', () => {
		const lecturerId = 'lecturer-venue-share';
		const semesterModuleIdValue = nextSemesterModuleId();
		const moduleIdValue = nextModuleId();
		const moduleName = 'Mathematics 101';

		const group1 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 120,
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const group2 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 120,
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const venues = [makeVenue({ capacity: 80 })];
		const plan = buildTermPlan(1, [group1, group2], venues);

		expect(plan).toHaveLength(1);
		expect(plan[0].allocationIds.sort()).toEqual([group1.id, group2.id].sort());
		expect(plan[0].capacityUsed).toBe(60);
	});

	it('allows venue sharing for same module + same lecturer (even with different semesterModuleIds)', () => {
		const lecturerId = 'lecturer-share-module';
		const moduleIdValue = nextModuleId();
		const moduleName = 'Physics 201';
		const semesterModuleId1 = nextSemesterModuleId();
		const semesterModuleId2 = nextSemesterModuleId();

		const alloc1 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 120,
			semesterModule: {
				id: semesterModuleId1,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleId1,
		});

		const alloc2 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 120,
			semesterModule: {
				id: semesterModuleId2,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleId2,
		});

		const venues = [makeVenue({ capacity: 80 })];
		const plan = buildTermPlan(1, [alloc1, alloc2], venues);

		expect(plan.length).toBe(1);
		expect(plan[0].allocationIds.sort()).toEqual([alloc1.id, alloc2.id].sort());
		expect(plan[0].capacityUsed).toBe(60);
	});

	it('does NOT allow venue sharing for different lecturers even with same module', () => {
		const semesterModuleIdValue = nextSemesterModuleId();
		const moduleIdValue = nextModuleId();
		const moduleName = 'Chemistry 301';

		const alloc1 = makeAllocation({
			userId: 'lecturer-A',
			numberOfStudents: 30,
			duration: 120,
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const alloc2 = makeAllocation({
			userId: 'lecturer-B',
			numberOfStudents: 30,
			duration: 120,
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const venues = [makeVenue({ capacity: 80 }), makeVenue({ capacity: 80 })];
		const plan = buildTermPlan(1, [alloc1, alloc2], venues);

		expect(plan.length).toBe(2);
	});

	it('does NOT allow venue sharing for different modules even with same lecturer', () => {
		const lecturerId = 'lecturer-multi-module';
		const moduleId1 = nextModuleId();
		const moduleId2 = nextModuleId();
		const moduleName1 = 'Biology 101';
		const moduleName2 = 'Biology 201';

		const alloc1 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 120,
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: moduleId1, name: moduleName1 },
			},
		});

		const alloc2 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 120,
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: moduleId2, name: moduleName2 },
			},
		});

		const venues = [makeVenue({ capacity: 80 }), makeVenue({ capacity: 80 })];
		const plan = buildTermPlan(1, [alloc1, alloc2], venues);

		expect(plan.length).toBe(2);

		const slot1 = plan.find((p) => p.allocationIds.includes(alloc1.id));
		const slot2 = plan.find((p) => p.allocationIds.includes(alloc2.id));

		expect(slot1?.allocationIds).toHaveLength(1);
		expect(slot2?.allocationIds).toHaveLength(1);
	});
});

describe('RUTHLESS STRESS TESTS - Massive Load', () => {
	it('handles 50+ allocations across 10 lecturers and 5 classes', () => {
		const venues = [];
		for (let i = 0; i < 15; i++) {
			venues.push(makeVenue({ capacity: 100 + i * 10 }));
		}

		const allocations: AllocationRecord[] = [];
		const lecturers = Array.from({ length: 10 }, (_, i) => `lecturer-${i}`);
		const semesters = Array.from({ length: 5 }, () => nextSemesterId());

		for (let i = 0; i < 60; i++) {
			const lecturer = lecturers[i % lecturers.length];
			const semesterId = semesters[i % semesters.length];

			allocations.push(
				makeAllocation({
					userId: lecturer,
					allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
					startTime: '08:00:00',
					endTime: '18:00:00',
					duration: 60 + (i % 5) * 30,
					numberOfStudents: 40 + (i % 8) * 10,
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const plan = buildTermPlan(1, allocations, venues, 4);

		expect(plan.length).toBeGreaterThan(0);

		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}
		}

		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}

		for (const slot of plan) {
			const venue = venues.find((v) => v.id === slot.venueId);
			if (venue) {
				const maxCapacity = Math.floor(venue.capacity * 1.1);
				expect(slot.capacityUsed).toBeLessThanOrEqual(maxCapacity);
			}
		}
	});

	it('handles 100 allocations with extreme time constraints', () => {
		const venues = [];
		for (let i = 0; i < 20; i++) {
			venues.push(makeVenue({ capacity: 80 }));
		}

		const allocations: AllocationRecord[] = [];

		for (let i = 0; i < 100; i++) {
			allocations.push(
				makeAllocation({
					userId: `lecturer-${i % 15}`,
					allowedDays: [(i % 2 === 0 ? 'monday' : 'tuesday') as DayOfWeek],
					startTime: '08:00:00',
					endTime: '17:00:00',
					duration: 60,
					numberOfStudents: 50,
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i % 10,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const plan = buildTermPlan(1, allocations, venues, 5);

		expect(plan.length).toBeGreaterThan(0);

		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}
		}

		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}
	});
});

describe('RUTHLESS STRESS TESTS - Constraint Violations (Allowed When Necessary)', () => {
	it('allows maxSlotsPerDay violation when absolutely no other option', () => {
		const lecturerId = 'lecturer-overload';
		const maxSlotsPerDay = 2;

		const allocations = [];
		for (let i = 0; i < 6; i++) {
			allocations.push(
				makeAllocation({
					userId: lecturerId,
					duration: 120,
					allowedDays: ['monday'],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: null,
						module: { id: nextModuleId() },
					},
					startTime: '08:00:00',
					endTime: '20:00:00',
				})
			);
		}

		const venues = [makeVenue(), makeVenue()];
		const plan = buildTermPlan(1, allocations, venues, maxSlotsPerDay);

		expect(plan.length).toBeGreaterThanOrEqual(6);

		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}
		}

		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}
	});

	it('allows 3 consecutive slots when no other option exists', () => {
		const lecturerId = `cons-lecturer-${nextSemesterId()}`;
		const semesterId = nextSemesterId();

		const allocations = [];
		for (let i = 0; i < 4; i++) {
			allocations.push(
				makeAllocation({
					userId: lecturerId,
					duration: 90,
					allowedDays: ['monday'],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: semesterId,
						module: { id: nextModuleId() },
					},
					startTime: '08:00:00',
					endTime: '16:00:00',
				})
			);
		}

		const venues = [makeVenue()];
		const plan = buildTermPlan(1, allocations, venues, 10);

		expect(plan.length).toBeGreaterThanOrEqual(4);

		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}
		}

		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}
	});
});

describe('RUTHLESS STRESS TESTS - Extreme Edge Cases', () => {
	it('handles allocations with tiny 15-minute durations', () => {
		const allocations = [];
		for (let i = 0; i < 20; i++) {
			allocations.push(
				makeAllocation({
					duration: 15,
					allowedDays: ['monday', 'tuesday'],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: null,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = [makeVenue(), makeVenue()];
		const plan = buildTermPlan(1, allocations, venues);

		expect(plan.length).toBeGreaterThan(0);

		for (const allocation of allocations) {
			const found = plan.some((slot) =>
				slot.allocationIds.includes(allocation.id)
			);
			expect(found).toBe(true);
		}
	});

	it('handles allocations with very long 5-hour durations', () => {
		const allocations = [];
		for (let i = 0; i < 6; i++) {
			allocations.push(
				makeAllocation({
					userId: `long-lecturer-${i}`,
					duration: 300,
					allowedDays: ['monday', 'tuesday', 'wednesday'],
					startTime: '08:00:00',
					endTime: '18:00:00',
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i % 3,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = [makeVenue({ capacity: 150 }), makeVenue({ capacity: 150 })];
		const plan = buildTermPlan(1, allocations, venues, 4);

		expect(plan.length).toBeGreaterThanOrEqual(6);

		for (const allocation of allocations) {
			const found = plan.some((slot) =>
				slot.allocationIds.includes(allocation.id)
			);
			expect(found).toBe(true);
		}
	});

	it('handles extreme capacity variations (10 to 500 students)', () => {
		const allocations = [];
		const studentCounts = [10, 50, 100, 200, 300, 450, 500];

		for (const count of studentCounts) {
			allocations.push(
				makeAllocation({
					numberOfStudents: count,
					duration: 120,
					allowedDays: ['monday', 'tuesday', 'wednesday'],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: null,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = [
			makeVenue({ capacity: 50 }),
			makeVenue({ capacity: 150 }),
			makeVenue({ capacity: 300 }),
			makeVenue({ capacity: 500 }),
		];

		const plan = buildTermPlan(1, allocations, venues);

		expect(plan.length).toBeGreaterThanOrEqual(studentCounts.length);

		for (const allocation of allocations) {
			const slot = plan.find((s) => s.allocationIds.includes(allocation.id));
			expect(slot).toBeDefined();

			if (slot) {
				const venue = venues.find((v) => v.id === slot.venueId);
				if (venue) {
					const maxCapacity = Math.floor(venue.capacity * 1.1);
					expect(slot.capacityUsed).toBeLessThanOrEqual(maxCapacity);
				}
			}
		}
	});

	it('handles multiple allocations with limited venue capacity', () => {
		const allocations = [];

		for (let i = 0; i < 8; i++) {
			allocations.push(
				makeAllocation({
					userId: `limited-lecturer-${i}`,
					startTime: '08:00:00',
					endTime: '17:00:00',
					duration: 60,
					allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i + 1,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = Array.from({ length: 3 }, () => makeVenue());
		const plan = buildTermPlan(1, allocations, venues, 5);

		expect(plan.length).toBeGreaterThan(0);

		for (const allocation of allocations) {
			const slot = plan.find((s) => s.allocationIds.includes(allocation.id));
			expect(slot).toBeDefined();

			if (slot) {
				const slotStart = timeToMinutes(slot.startTime);
				const slotEnd = timeToMinutes(slot.endTime);
				const windowStart = timeToMinutes(allocation.startTime);
				const windowEnd = timeToMinutes(allocation.endTime);

				expect(slotStart).toBeGreaterThanOrEqual(windowStart);
				expect(slotEnd).toBeLessThanOrEqual(windowEnd);
			}
		}
	});
});

describe('RUTHLESS STRESS TESTS - Complex Lecturer Conflicts', () => {
	it('prevents same lecturer teaching 5 different modules simultaneously', () => {
		const lecturerId = 'super-lecturer';

		const allocations = [];
		for (let i = 0; i < 5; i++) {
			allocations.push(
				makeAllocation({
					userId: lecturerId,
					duration: 120,
					allowedDays: ['monday', 'tuesday', 'wednesday'],
					startTime: '08:00:00',
					endTime: '18:00:00',
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i + 1,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = Array.from({ length: 3 }, () => makeVenue());
		const plan = buildTermPlan(1, allocations, venues, 5);

		const lecturerSlots = plan.map((p) => ({
			start: timeToMinutes(p.startTime),
			end: timeToMinutes(p.endTime),
			day: p.dayOfWeek,
			allocationIds: p.allocationIds,
		}));

		for (let i = 0; i < lecturerSlots.length; i++) {
			for (let j = i + 1; j < lecturerSlots.length; j++) {
				if (lecturerSlots[i].day === lecturerSlots[j].day) {
					const noOverlap =
						lecturerSlots[i].end <= lecturerSlots[j].start ||
						lecturerSlots[j].end <= lecturerSlots[i].start;
					expect(noOverlap).toBe(true);
				}
			}
		}
	});

	it('handles 20 lecturers with complex overlapping constraints', () => {
		const lecturers = Array.from({ length: 20 }, (_, i) => `lecturer-${i}`);
		const allocations: AllocationRecord[] = [];

		for (let i = 0; i < 80; i++) {
			const lecturer = lecturers[i % lecturers.length];
			allocations.push(
				makeAllocation({
					userId: lecturer,
					duration: 90,
					allowedDays: ['monday', 'tuesday', 'wednesday'],
					startTime: '08:00:00',
					endTime: '17:00:00',
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i % 10,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = Array.from({ length: 15 }, () => makeVenue());
		const plan = buildTermPlan(1, allocations, venues, 4);

		expect(plan.length).toBeGreaterThan(0);

		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}
		}

		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}
	});
});

describe('RUTHLESS STRESS TESTS - Complex Class Conflicts', () => {
	it('prevents same class from being in 10 different places simultaneously', () => {
		const semesterIdValue = nextSemesterId();

		const allocations = [];
		for (let i = 0; i < 10; i++) {
			allocations.push(
				makeAllocation({
					userId: `lecturer-${i}`,
					duration: 120,
					allowedDays: ['monday', 'tuesday', 'wednesday'],
					startTime: '08:00:00',
					endTime: '18:00:00',
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: semesterIdValue,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = Array.from({ length: 10 }, () => makeVenue());
		const plan = buildTermPlan(1, allocations, venues, 10);

		const classSlots = plan.map((p) => ({
			start: timeToMinutes(p.startTime),
			end: timeToMinutes(p.endTime),
			day: p.dayOfWeek,
		}));

		classSlots.sort((a, b) => {
			if (a.day !== b.day) return a.day.localeCompare(b.day);
			return a.start - b.start;
		});

		for (let i = 0; i < classSlots.length - 1; i++) {
			if (classSlots[i].day === classSlots[i + 1].day) {
				expect(classSlots[i].end).toBeLessThanOrEqual(classSlots[i + 1].start);
			}
		}
	});

	it('handles 15 different classes with 5 modules each', () => {
		const semesters = Array.from({ length: 15 }, () => nextSemesterId());
		const allocations: AllocationRecord[] = [];

		for (const semesterId of semesters) {
			for (let i = 0; i < 5; i++) {
				allocations.push(
					makeAllocation({
						userId: `lecturer-${i}`,
						duration: 120,
						allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday'],
						startTime: '08:00:00',
						endTime: '18:00:00',
						semesterModule: {
							id: nextSemesterModuleId(),
							semesterId,
							module: { id: nextModuleId() },
						},
					})
				);
			}
		}

		const venues = Array.from({ length: 20 }, () => makeVenue());
		const plan = buildTermPlan(1, allocations, venues, 3);

		expect(plan.length).toBeGreaterThan(0);

		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}
		}

		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}
	});
});

describe('RUTHLESS STRESS TESTS - Mixed Extreme Scenarios', () => {
	it('handles extreme scenario: 80 allocations, 10 venues, 5 days, 1 lecturer teaches 20 modules', () => {
		const superLecturer = 'super-lecturer';
		const allocations: AllocationRecord[] = [];

		for (let i = 0; i < 20; i++) {
			allocations.push(
				makeAllocation({
					userId: superLecturer,
					duration: 90,
					allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
					startTime: '08:00:00',
					endTime: '20:00:00',
					numberOfStudents: 50,
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i % 5,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		for (let i = 0; i < 60; i++) {
			allocations.push(
				makeAllocation({
					userId: `lecturer-${i % 10}`,
					duration: 90,
					allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
					startTime: '08:00:00',
					endTime: '20:00:00',
					numberOfStudents: 40 + (i % 10) * 5,
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i % 8,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = Array.from({ length: 10 }, () =>
			makeVenue({ capacity: 100 })
		);
		const plan = buildTermPlan(1, allocations, venues, 6);

		expect(plan.length).toBeGreaterThan(0);

		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}
		}

		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}
	});

	it('stress test with all constraint types active simultaneously', () => {
		const labTypeId = 'type-100';
		const lectureTypeId = 'type-101';
		const studioTypeId = 'type-102';

		const allocations: AllocationRecord[] = [];

		for (let i = 0; i < 45; i++) {
			const venueType = [labTypeId, lectureTypeId, studioTypeId][i % 3];

			allocations.push(
				makeAllocation({
					userId: `lecturer-${i % 10}`,
					duration: [60, 90, 120][i % 3],
					numberOfStudents: 30 + (i % 8) * 10,
					allowedDays: [
						['monday', 'wednesday', 'friday'],
						['tuesday', 'thursday'],
						['monday', 'tuesday', 'wednesday', 'thursday'],
						['thursday', 'friday', 'monday'],
						['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
					][i % 5] as DayOfWeek[],
					startTime: '08:00:00',
					endTime: '18:00:00',
					timetableAllocationVenueTypes: [{ venueTypeId: venueType }],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i % 10,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = [
			...Array.from({ length: 8 }, () =>
				makeVenue({
					capacity: 120,
					typeId: labTypeId,
					type: {
						id: labTypeId,
						name: 'Lab',
						description: null,
						createdAt: new Date(),
					},
				})
			),
			...Array.from({ length: 8 }, () =>
				makeVenue({
					capacity: 150,
					typeId: lectureTypeId,
					type: {
						id: lectureTypeId,
						name: 'Lecture',
						description: null,
						createdAt: new Date(),
					},
				})
			),
			...Array.from({ length: 7 }, () =>
				makeVenue({
					capacity: 100,
					typeId: studioTypeId,
					type: {
						id: studioTypeId,
						name: 'Studio',
						description: null,
						createdAt: new Date(),
					},
				})
			),
		];

		const plan = buildTermPlan(1, allocations, venues, 5);

		expect(plan.length).toBeGreaterThan(0);

		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}

			const venue = venues.find((v) => v.id === slot.venueId);
			expect(venue).toBeDefined();

			if (venue) {
				const maxCapacity = Math.floor(venue.capacity * 1.1);
				expect(slot.capacityUsed).toBeLessThanOrEqual(maxCapacity);
			}
		}

		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}
	});
});

describe('RUTHLESS STRESS TESTS - School-Based Venue Filtering', () => {
	it('handles 50 lecturers across 10 schools with strict venue filtering', () => {
		const schools = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		const venues: VenueRecord[] = [];

		for (let i = 0; i < 30; i++) {
			const schoolId = schools[i % schools.length];
			venues.push(
				makeVenue({
					capacity: 80 + i * 5,
					venueSchools: [{ schoolId }],
				})
			);
		}

		const allocations: AllocationRecord[] = [];
		for (let i = 0; i < 50; i++) {
			const schoolId = schools[i % schools.length];
			allocations.push(
				makeAllocation({
					userId: `lecturer-${i}`,
					duration: 90,
					numberOfStudents: 40 + (i % 10) * 5,
					allowedDays: ['monday', 'tuesday', 'wednesday'],
					user: {
						userSchools: [{ schoolId }],
					},
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i % 8,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const plan = buildTermPlan(1, allocations, venues, 4);

		expect(plan.length).toBeGreaterThan(0);

		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}
		}

		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}

		for (const slot of plan) {
			const venue = venues.find((v) => v.id === slot.venueId);
			expect(venue).toBeDefined();

			for (const allocId of slot.allocationIds) {
				const alloc = allocations.find((a) => a.id === allocId);
				expect(alloc).toBeDefined();

				if (venue && alloc) {
					const venueSchoolIds = venue.venueSchools.map((vs) => vs.schoolId);
					const lecturerSchoolIds = alloc.user.userSchools.map(
						(us) => us.schoolId
					);
					const hasCommonSchool = lecturerSchoolIds.some((id) =>
						venueSchoolIds.includes(id)
					);
					expect(hasCommonSchool).toBe(true);
				}
			}
		}
	});

	it('handles lecturers with multiple schools accessing shared venues', () => {
		const school1 = 100;
		const school2 = 200;
		const school3 = 300;

		const allocations: AllocationRecord[] = [];
		for (let i = 0; i < 20; i++) {
			const schools =
				i % 3 === 0
					? [school1, school2]
					: i % 3 === 1
						? [school2, school3]
						: [school1];

			allocations.push(
				makeAllocation({
					userId: `multi-school-lecturer-${i}`,
					duration: 90,
					numberOfStudents: 50,
					allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday'],
					user: {
						userSchools: schools.map((schoolId) => ({ schoolId })),
					},
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i % 5,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues: VenueRecord[] = [
			...Array.from({ length: 5 }, (_, _i) =>
				makeVenue({
					capacity: 100,
					venueSchools: [{ schoolId: school1 }],
				})
			),
			...Array.from({ length: 5 }, (_, _i) =>
				makeVenue({
					capacity: 100,
					venueSchools: [{ schoolId: school2 }],
				})
			),
			...Array.from({ length: 5 }, (_, _i) =>
				makeVenue({
					capacity: 100,
					venueSchools: [{ schoolId: school3 }],
				})
			),
			...Array.from({ length: 3 }, (_, _i) =>
				makeVenue({
					capacity: 100,
					venueSchools: [{ schoolId: school1 }, { schoolId: school2 }],
				})
			),
		];

		const plan = buildTermPlan(1, allocations, venues, 4);

		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}
		}

		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}

		for (const slot of plan) {
			const venue = venues.find((v) => v.id === slot.venueId);
			expect(venue).toBeDefined();

			for (const allocId of slot.allocationIds) {
				const alloc = allocations.find((a) => a.id === allocId);
				if (venue && alloc) {
					const venueSchoolIds = venue.venueSchools.map((vs) => vs.schoolId);
					const lecturerSchoolIds = alloc.user.userSchools.map(
						(us) => us.schoolId
					);
					const hasCommonSchool = lecturerSchoolIds.some((id) =>
						venueSchoolIds.includes(id)
					);
					expect(hasCommonSchool).toBe(true);
				}
			}
		}
	});

	it('correctly handles school filtering with all other constraints combined', () => {
		const school1 = 500;
		const school2 = 600;
		const labTypeId = 'type-777';
		const lectureTypeId = 'type-888';

		const allocations: AllocationRecord[] = [];
		for (let i = 0; i < 30; i++) {
			const schoolId = i % 2 === 0 ? school1 : school2;
			const venueType = i % 2 === 0 ? labTypeId : lectureTypeId;

			allocations.push(
				makeAllocation({
					userId: `complex-lecturer-${i % 10}`,
					duration: [60, 90, 120][i % 3],
					numberOfStudents: 40 + (i % 8) * 5,
					allowedDays: [
						['monday', 'wednesday'],
						['tuesday', 'thursday'],
						['monday', 'tuesday', 'wednesday'],
					][i % 3] as DayOfWeek[],
					user: {
						userSchools: [{ schoolId }],
					},
					timetableAllocationVenueTypes: [{ venueTypeId: venueType }],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i % 6,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues: VenueRecord[] = [
			...Array.from({ length: 6 }, (_, _i) =>
				makeVenue({
					capacity: 100,
					typeId: labTypeId,
					type: {
						id: labTypeId,
						name: 'Lab',
						description: null,
						createdAt: new Date(),
					},
					venueSchools: [{ schoolId: school1 }],
				})
			),
			...Array.from({ length: 6 }, (_, _i) =>
				makeVenue({
					capacity: 100,
					typeId: lectureTypeId,
					type: {
						id: lectureTypeId,
						name: 'Lecture',
						description: null,
						createdAt: new Date(),
					},
					venueSchools: [{ schoolId: school2 }],
				})
			),
		];

		const plan = buildTermPlan(1, allocations, venues, 4);

		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}
		}

		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}

		for (const slot of plan) {
			const venue = venues.find((v) => v.id === slot.venueId);
			expect(venue).toBeDefined();

			for (const allocId of slot.allocationIds) {
				const alloc = allocations.find((a) => a.id === allocId);
				if (venue && alloc) {
					const venueSchoolIds = venue.venueSchools.map((vs) => vs.schoolId);
					const lecturerSchoolIds = alloc.user.userSchools.map(
						(us) => us.schoolId
					);
					const hasCommonSchool = lecturerSchoolIds.some((id) =>
						venueSchoolIds.includes(id)
					);
					expect(hasCommonSchool).toBe(true);

					if (alloc.timetableAllocationVenueTypes.length > 0) {
						const requiredTypeIds = alloc.timetableAllocationVenueTypes.map(
							(vt) => vt.venueTypeId
						);
						expect(requiredTypeIds).toContain(venue.typeId);
					}
				}
			}
		}
	});
});

describe('HARD CONSTRAINT NEVER VIOLATED TESTS', () => {
	it('NEVER allows lecturer to be in different venues simultaneously even when impossible to schedule', () => {
		const lecturerId = 'single-loc-lecturer';

		const allocations = [
			makeAllocation({
				userId: lecturerId,
				duration: 120,
				allowedDays: ['monday'],
				startTime: '08:00:00',
				endTime: '10:30:00',
				semesterModule: {
					id: nextSemesterModuleId(),
					semesterId: null,
					module: { id: nextModuleId() },
				},
			}),
			makeAllocation({
				userId: lecturerId,
				duration: 120,
				allowedDays: ['monday'],
				startTime: '08:00:00',
				endTime: '10:30:00',
				semesterModule: {
					id: nextSemesterModuleId(),
					semesterId: null,
					module: { id: nextModuleId() },
				},
			}),
		];

		const venues = [
			makeVenue({ id: 'venue-hard-1', capacity: 100 }),
			makeVenue({ id: 'venue-hard-2', capacity: 100 }),
		];

		expect(() => buildTermPlan(1, allocations, venues, 10)).toThrow();
	});

	it('NEVER allows student class to have overlapping modules even when impossible to schedule', () => {
		const semesterIdValue = nextSemesterId();

		const allocations = [
			makeAllocation({
				userId: 'lecturer-1',
				duration: 120,
				allowedDays: ['monday'],
				startTime: '08:00:00',
				endTime: '10:30:00',
				semesterModule: {
					id: nextSemesterModuleId(),
					semesterId: semesterIdValue,
					module: { id: nextModuleId() },
				},
			}),
			makeAllocation({
				userId: 'lecturer-2',
				duration: 120,
				allowedDays: ['monday'],
				startTime: '08:00:00',
				endTime: '10:30:00',
				semesterModule: {
					id: nextSemesterModuleId(),
					semesterId: semesterIdValue,
					module: { id: nextModuleId() },
				},
			}),
		];

		const venues = [
			makeVenue({ id: 'venue-hard-3', capacity: 100 }),
			makeVenue({ id: 'venue-hard-4', capacity: 100 }),
		];

		expect(() => buildTermPlan(1, allocations, venues, 10)).toThrow();
	});

	it('NEVER exceeds venue capacity by more than 10% even when combining slots', () => {
		const lecturerId = 'capacity-lecturer';
		const moduleIdValue = nextModuleId();
		const semesterModuleIdValue = nextSemesterModuleId();

		const allocations = [
			makeAllocation({
				userId: lecturerId,
				numberOfStudents: 60,
				duration: 120,
				semesterModule: {
					id: semesterModuleIdValue,
					semesterId: null,
					module: { id: moduleIdValue },
				},
				semesterModuleId: semesterModuleIdValue,
			}),
			makeAllocation({
				userId: lecturerId,
				numberOfStudents: 60,
				duration: 120,
				semesterModule: {
					id: semesterModuleIdValue,
					semesterId: null,
					module: { id: moduleIdValue },
				},
				semesterModuleId: semesterModuleIdValue,
			}),
		];

		const venue = makeVenue({ id: 'venue-capacity-test', capacity: 100 });
		const plan = buildTermPlan(1, allocations, [venue], 10);

		expect(plan.length).toBe(2);

		for (const slot of plan) {
			const maxCapacity = Math.floor(100 * 1.1);
			expect(slot.capacityUsed).toBeLessThanOrEqual(maxCapacity);
		}
	});

	it('NEVER assigns allocation to venue from different school', () => {
		const school1 = 1000;
		const school2 = 2000;

		const allocation = makeAllocation({
			userId: 'school-test-lecturer',
			numberOfStudents: 50,
			user: {
				userSchools: [{ schoolId: school1 }],
			},
		});

		const venue = makeVenue({
			id: 'wrong-school-venue',
			capacity: 100,
			venueSchools: [{ schoolId: school2 }],
		});

		expect(() => buildTermPlan(1, [allocation], [venue], 10)).toThrow();
	});

	it('NEVER assigns allocation to wrong venue type', () => {
		const labTypeId = 'type-lab-test';
		const lectureTypeId = 'type-lecture-test';

		const allocation = makeAllocation({
			timetableAllocationVenueTypes: [{ venueTypeId: labTypeId }],
		});

		const venue = makeVenue({
			id: 'wrong-type-venue',
			capacity: 100,
			typeId: lectureTypeId,
			type: {
				id: lectureTypeId,
				name: 'Lecture',
				description: null,
				createdAt: new Date(),
			},
		});

		expect(() => buildTermPlan(1, [allocation], [venue], 10)).toThrow();
	});

	it('NEVER schedules slot outside time window', () => {
		const allocation = makeAllocation({
			duration: 120,
			startTime: '14:00:00',
			endTime: '16:00:00',
		});

		const venue = makeVenue({ capacity: 100 });
		const plan = buildTermPlan(1, [allocation], [venue], 10);

		expect(plan.length).toBe(1);

		const startMinutes =
			Number(plan[0].startTime.split(':')[0]) * 60 +
			Number(plan[0].startTime.split(':')[1]);
		const endMinutes =
			Number(plan[0].endTime.split(':')[0]) * 60 +
			Number(plan[0].endTime.split(':')[1]);

		expect(startMinutes).toBeGreaterThanOrEqual(14 * 60);
		expect(endMinutes).toBeLessThanOrEqual(16 * 60);
	});

	it('NEVER allows different modules to share a slot even with same lecturer', () => {
		const lecturerId = 'no-mix-lecturer';
		const module1 = nextModuleId();
		const module2 = nextModuleId();

		const alloc1 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 120,
			allowedDays: ['monday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: module1, code: 'MOD-A' },
			},
		});

		const alloc2 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 120,
			allowedDays: ['monday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: module2, code: 'MOD-B' },
			},
		});

		const venue = makeVenue({ capacity: 100 });
		const plan = buildTermPlan(1, [alloc1, alloc2], [venue], 10);

		expect(plan.length).toBe(2);

		const slot1 = plan.find((p) => p.allocationIds.includes(alloc1.id));
		const slot2 = plan.find((p) => p.allocationIds.includes(alloc2.id));
		expect(slot1?.allocationIds.length).toBe(1);
		expect(slot2?.allocationIds.length).toBe(1);
	});

	it('NEVER allows different class types to share a slot even with same lecturer and module', () => {
		const lecturerId = 'class-type-lecturer';
		const moduleIdValue = nextModuleId();

		const lecture = makeAllocation({
			userId: lecturerId,
			classType: 'lecture',
			numberOfStudents: 30,
			duration: 120,
			allowedDays: ['monday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: moduleIdValue, code: 'SAME-MOD' },
			},
		});

		const tutorial = makeAllocation({
			userId: lecturerId,
			classType: 'tutorial',
			numberOfStudents: 30,
			duration: 120,
			allowedDays: ['monday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: moduleIdValue, code: 'SAME-MOD' },
			},
		});

		const venue = makeVenue({ capacity: 100 });
		const plan = buildTermPlan(1, [lecture, tutorial], [venue], 10);

		expect(plan.length).toBe(2);

		const slot1 = plan.find((p) => p.allocationIds.includes(lecture.id));
		const slot2 = plan.find((p) => p.allocationIds.includes(tutorial.id));
		expect(slot1?.allocationIds.length).toBe(1);
		expect(slot2?.allocationIds.length).toBe(1);
	});
});

describe('VENUE SHARING RULES TESTS', () => {
	it('allows venue sharing ONLY when same lecturer + same module code + same class type', () => {
		const lecturerId = 'share-lecturer';
		const moduleIdValue = nextModuleId();
		const moduleCode = 'SHARE-MOD';

		const group1 = makeAllocation({
			userId: lecturerId,
			classType: 'lecture',
			numberOfStudents: 30,
			duration: 120,
			groupName: 'A',
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: moduleIdValue, code: moduleCode },
			},
		});

		const group2 = makeAllocation({
			userId: lecturerId,
			classType: 'lecture',
			numberOfStudents: 30,
			duration: 120,
			groupName: 'B',
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: moduleIdValue, code: moduleCode },
			},
		});

		const venue = makeVenue({ capacity: 80 });
		const plan = buildTermPlan(1, [group1, group2], [venue], 10);

		expect(plan.length).toBe(1);
		expect(plan[0].allocationIds.sort()).toEqual([group1.id, group2.id].sort());
		expect(plan[0].capacityUsed).toBe(60);
	});

	it('does NOT combine slots when durations differ', () => {
		const lecturerId = 'duration-diff-lecturer';
		const moduleIdValue = nextModuleId();
		const moduleCode = 'DUR-MOD';

		const short = makeAllocation({
			userId: lecturerId,
			classType: 'lecture',
			numberOfStudents: 30,
			duration: 60,
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: moduleIdValue, code: moduleCode },
			},
		});

		const longer = makeAllocation({
			userId: lecturerId,
			classType: 'lecture',
			numberOfStudents: 30,
			duration: 120,
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: moduleIdValue, code: moduleCode },
			},
		});

		const venue = makeVenue({ capacity: 100 });
		const plan = buildTermPlan(1, [short, longer], [venue], 10);

		expect(plan.length).toBe(2);
	});
});

describe('buildTermPlan - EXTREME Stress Tests', () => {
	it('handles highly constrained scenario with very limited time windows', () => {
		const venues: VenueRecord[] = [
			makeVenue({ id: 'venue-2000', capacity: 100 }),
			makeVenue({ id: 'venue-2001', capacity: 100 }),
			makeVenue({ id: 'venue-2002', capacity: 100 }),
			makeVenue({ id: 'venue-2003', capacity: 100 }),
		];

		const allocations: AllocationRecord[] = [];

		for (let i = 0; i < 8; i++) {
			allocations.push(
				makeAllocation({
					userId: `constrained-lecturer-${i}`,
					allowedDays: ['monday', 'tuesday', 'wednesday'],
					startTime: '09:00:00',
					endTime: '15:00:00',
					duration: 120,
					numberOfStudents: 50,
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i + 1,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const plan = buildTermPlan(1, allocations, venues, 5);

		const placedIds = new Set<number>();
		for (const slot of plan) {
			for (const id of slot.allocationIds) {
				placedIds.add(id);
			}
		}

		expect(placedIds.size).toBe(allocations.length);
	});

	it('handles worst-case backtracking scenario', () => {
		const venue = makeVenue({ id: 'venue-3000', capacity: 100 });
		const semester1 = nextSemesterId();
		const semester2 = nextSemesterId();

		const allocations: AllocationRecord[] = [
			makeAllocation({
				userId: 'bt-lecturer-1',
				allowedDays: ['monday', 'tuesday'],
				startTime: '08:00:00',
				endTime: '18:00:00',
				duration: 180,
				semesterModule: {
					id: nextSemesterModuleId(),
					semesterId: semester1,
					module: { id: nextModuleId() },
				},
			}),
			makeAllocation({
				userId: 'bt-lecturer-2',
				allowedDays: ['monday', 'tuesday'],
				startTime: '08:00:00',
				endTime: '18:00:00',
				duration: 180,
				semesterModule: {
					id: nextSemesterModuleId(),
					semesterId: semester2,
					module: { id: nextModuleId() },
				},
			}),
			makeAllocation({
				userId: 'bt-lecturer-3',
				allowedDays: ['monday'],
				startTime: '08:00:00',
				endTime: '18:00:00',
				duration: 180,
				semesterModule: {
					id: nextSemesterModuleId(),
					semesterId: semester1,
					module: { id: nextModuleId() },
				},
			}),
		];

		const plan = buildTermPlan(1, allocations, [venue], 5);

		const placedIds = new Set<number>();
		for (const slot of plan) {
			for (const id of slot.allocationIds) {
				placedIds.add(id);
			}
		}

		expect(placedIds.size).toBe(3);
	});

	it('handles realistic university scenario with multiple programs', () => {
		const venues: VenueRecord[] = [];
		const lectureHallTypeId = 'type-1';
		const tutorialRoomTypeId = 'type-2';

		for (let i = 0; i < 15; i++) {
			venues.push(
				makeVenue({
					id: `venue-${5000 + i}`,
					capacity: 100 + i * 10,
					typeId: lectureHallTypeId,
					type: {
						id: lectureHallTypeId,
						name: 'Lecture Hall',
						description: null,
						createdAt: new Date(),
					},
				})
			);
		}

		for (let i = 0; i < 20; i++) {
			venues.push(
				makeVenue({
					id: `venue-${5100 + i}`,
					capacity: 30 + i * 2,
					typeId: tutorialRoomTypeId,
					type: {
						id: tutorialRoomTypeId,
						name: 'Tutorial Room',
						description: null,
						createdAt: new Date(),
					},
				})
			);
		}

		const allocations: AllocationRecord[] = [];
		let lecturerCounter = 0;

		for (let program = 0; program < 5; program++) {
			for (let semester = 0; semester < 4; semester++) {
				const semesterIdValue = program * 4 + semester + 1;

				for (let module = 0; module < 6; module++) {
					const moduleIdValue = nextModuleId();
					const moduleName = `Program${program}-Module${module}`;
					const lecturerId = `lecturer-${lecturerCounter % 30}`;
					lecturerCounter++;

					allocations.push(
						makeAllocation({
							userId: lecturerId,
							allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday'],
							startTime: '08:00:00',
							endTime: '17:00:00',
							duration: 120,
							classType: 'lecture',
							numberOfStudents: 80 + program * 10,
							semesterModule: {
								id: nextSemesterModuleId(),
								semesterId: semesterIdValue,
								module: { id: moduleIdValue, name: moduleName },
							},
							timetableAllocationVenueTypes: [
								{ venueTypeId: lectureHallTypeId },
							],
						})
					);

					allocations.push(
						makeAllocation({
							userId: lecturerId,
							allowedDays: ['wednesday', 'thursday', 'friday'],
							startTime: '08:00:00',
							endTime: '17:00:00',
							duration: 90,
							classType: 'tutorial',
							numberOfStudents: 25,
							semesterModule: {
								id: nextSemesterModuleId(),
								semesterId: semesterIdValue,
								module: { id: moduleIdValue, name: moduleName },
							},
							timetableAllocationVenueTypes: [
								{ venueTypeId: tutorialRoomTypeId },
							],
						})
					);
				}
			}
		}

		const plan = buildTermPlan(1, allocations, venues, 4);

		const placedIds = new Set<number>();
		for (const slot of plan) {
			for (const id of slot.allocationIds) {
				placedIds.add(id);
			}
		}

		expect(placedIds.size).toBe(allocations.length);

		for (const slot of plan) {
			const venue = venues.find((v) => v.id === slot.venueId);
			expect(venue).toBeDefined();

			const allocsInSlot = allocations.filter((a) =>
				slot.allocationIds.includes(a.id)
			);

			for (const alloc of allocsInSlot) {
				if (alloc.timetableAllocationVenueTypes.length > 0) {
					const requiredTypeIds = alloc.timetableAllocationVenueTypes.map(
						(vt) => vt.venueTypeId
					);
					expect(requiredTypeIds).toContain(venue!.typeId);
				}
			}
		}

		const slotsBySemester = new Map<number, typeof plan>();
		for (const slot of plan) {
			for (const allocId of slot.allocationIds) {
				const alloc = allocations.find((a) => a.id === allocId);
				if (alloc && alloc.semesterModule.semesterId !== null) {
					const semId = alloc.semesterModule.semesterId;
					if (!slotsBySemester.has(semId)) {
						slotsBySemester.set(semId, []);
					}
					slotsBySemester.get(semId)!.push(slot);
				}
			}
		}

		for (const [, slots] of slotsBySemester.entries()) {
			const sameDay = new Map<string, typeof slots>();
			for (const slot of slots) {
				if (!sameDay.has(slot.dayOfWeek)) {
					sameDay.set(slot.dayOfWeek, []);
				}
				sameDay.get(slot.dayOfWeek)!.push(slot);
			}

			for (const [, daySlots] of sameDay.entries()) {
				for (let i = 0; i < daySlots.length; i++) {
					for (let j = i + 1; j < daySlots.length; j++) {
						const slot1 = daySlots[i];
						const slot2 = daySlots[j];

						const start1 = timeToMinutes(slot1.startTime);
						const end1 = timeToMinutes(slot1.endTime);
						const start2 = timeToMinutes(slot2.startTime);
						const end2 = timeToMinutes(slot2.endTime);

						const noOverlap = end1 <= start2 || end2 <= start1;
						expect(noOverlap).toBe(true);
					}
				}
			}
		}
	});

	it('handles edge case with all allocations having same constraints', () => {
		const venues: VenueRecord[] = [
			makeVenue({ id: 'venue-6000', capacity: 50 }),
			makeVenue({ id: 'venue-6001', capacity: 50 }),
		];
		const allocations: AllocationRecord[] = [];

		for (let i = 0; i < 15; i++) {
			allocations.push(
				makeAllocation({
					userId: `identical-lecturer-${i}`,
					allowedDays: ['monday', 'tuesday'],
					startTime: '08:00:00',
					endTime: '17:00:00',
					duration: 120,
					numberOfStudents: 40,
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i + 1,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const plan = buildTermPlan(1, allocations, venues, 10);

		const placedIds = new Set<number>();
		for (const slot of plan) {
			for (const id of slot.allocationIds) {
				placedIds.add(id);
			}
		}

		expect(placedIds.size).toBe(15);
	});
});
