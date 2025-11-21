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
		const lecturerId = 'lecturer-consecutive';
		const semesterIdValue = nextSemesterId();

		const allocations = [];
		for (let i = 0; i < 6; i++) {
			allocations.push(
				makeAllocation({
					userId: lecturerId,
					duration: 60,
					allowedDays: ['monday'],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: semesterIdValue,
						module: { id: nextModuleId() },
					},
					startTime: '08:00:00',
					endTime: '14:00:00',
				})
			);
		}

		const venues = [makeVenue()];
		const plan = buildTermPlan(1, allocations, venues, 10);

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
		for (let i = 0; i < 10; i++) {
			allocations.push(
				makeAllocation({
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

		expect(plan.length).toBeGreaterThanOrEqual(10);

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

	it('handles very narrow time windows (2-hour windows)', () => {
		const allocations = [];

		for (let i = 0; i < 15; i++) {
			const hour = 8 + (i % 6);
			allocations.push(
				makeAllocation({
					startTime: `${hour.toString().padStart(2, '0')}:00:00`,
					endTime: `${(hour + 2).toString().padStart(2, '0')}:00:00`,
					duration: 90,
					allowedDays: ['monday', 'tuesday'],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: i % 3,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = [makeVenue(), makeVenue(), makeVenue()];
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
		const semesterIdValue = nextSemesterId();

		const allocations = [];
		for (let i = 0; i < 5; i++) {
			allocations.push(
				makeAllocation({
					userId: lecturerId,
					duration: 120,
					allowedDays: ['monday'],
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

		const venues = Array.from({ length: 5 }, () => makeVenue());
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
		const labTypeId = 100;
		const lectureTypeId = 101;
		const studioTypeId = 102;

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
			...Array.from({ length: 5 }, (_, i) =>
				makeVenue({
					capacity: 100,
					venueSchools: [{ schoolId: school1 }],
				})
			),
			...Array.from({ length: 5 }, (_, i) =>
				makeVenue({
					capacity: 100,
					venueSchools: [{ schoolId: school2 }],
				})
			),
			...Array.from({ length: 5 }, (_, i) =>
				makeVenue({
					capacity: 100,
					venueSchools: [{ schoolId: school3 }],
				})
			),
			...Array.from({ length: 3 }, (_, i) =>
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
		const labTypeId = 777;
		const lectureTypeId = 888;

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
					][i % 3] as any,
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
			...Array.from({ length: 6 }, (_, i) =>
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
			...Array.from({ length: 6 }, (_, i) =>
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

describe('buildTermPlan - EXTREME Stress Tests', () => {
	it('handles 50+ allocations with multiple constraints', () => {
		const venues: VenueRecord[] = [];
		for (let i = 0; i < 10; i++) {
			venues.push(
				makeVenue({
					id: 1000 + i,
					capacity: 50 + i * 10,
					typeId: (i % 3) + 1,
					type: {
						id: (i % 3) + 1,
						name: `Type ${(i % 3) + 1}`,
						description: null,
						createdAt: new Date(),
					},
				})
			);
		}

		const allocations: AllocationRecord[] = [];
		const lecturers = 15;
		const semesters = 10;

		for (let i = 0; i < 50; i++) {
			const lecturerId = `stress-lecturer-${i % lecturers}`;
			const semesterIdValue = (i % semesters) + 1;

			allocations.push(
				makeAllocation({
					userId: lecturerId,
					allowedDays: [
						'monday',
						'tuesday',
						'wednesday',
						'thursday',
						'friday',
					].slice(0, 3 + (i % 3)) as DayOfWeek[],
					startTime: '08:00:00',
					endTime: '17:00:00',
					duration: 60 + (i % 5) * 30,
					numberOfStudents: 30 + (i % 8) * 5,
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: semesterIdValue,
						module: { id: nextModuleId(), name: `Module-${i}` },
					},
					timetableAllocationVenueTypes:
						i % 4 === 0 ? [{ venueTypeId: ((i % 3) + 1) as number }] : [],
				})
			);
		}

		const plan = buildTermPlan(1, allocations, venues, 4);

		const placedIds = new Set<number>();
		for (const slot of plan) {
			for (const id of slot.allocationIds) {
				placedIds.add(id);
			}
		}

		for (const alloc of allocations) {
			expect(placedIds.has(alloc.id)).toBe(true);
		}

		for (const slot of plan) {
			const venue = venues.find((v) => v.id === slot.venueId);
			if (venue) {
				expect(slot.capacityUsed).toBeLessThanOrEqual(
					Math.floor(venue.capacity * 1.1)
				);
			}
		}
	});

	it('handles highly constrained scenario with very limited time windows', () => {
		const venues: VenueRecord[] = [
			makeVenue({ id: 2000, capacity: 100 }),
			makeVenue({ id: 2001, capacity: 100 }),
			makeVenue({ id: 2002, capacity: 100 }),
		];

		const allocations: AllocationRecord[] = [];

		for (let i = 0; i < 8; i++) {
			allocations.push(
				makeAllocation({
					userId: `constrained-lecturer-${i}`,
					allowedDays: ['monday', 'tuesday'],
					startTime: '10:00:00',
					endTime: '14:00:00',
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
		const venue = makeVenue({ id: 3000, capacity: 100 });
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

	it('handles 100+ allocations across multiple days and venues', () => {
		const venues: VenueRecord[] = [];
		for (let i = 0; i < 20; i++) {
			venues.push(
				makeVenue({
					id: 4000 + i,
					capacity: 40 + i * 5,
				})
			);
		}

		const allocations: AllocationRecord[] = [];

		for (let i = 0; i < 100; i++) {
			allocations.push(
				makeAllocation({
					userId: `mega-lecturer-${i % 25}`,
					allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
					startTime: '08:00:00',
					endTime: '18:00:00',
					duration: 60 + (i % 4) * 30,
					numberOfStudents: 25 + (i % 10) * 3,
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: (i % 15) + 1,
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

		expect(placedIds.size).toBe(100);
	});

	it('handles realistic university scenario with multiple programs', () => {
		const venues: VenueRecord[] = [];
		const lectureHallTypeId = 1;
		const tutorialRoomTypeId = 2;

		for (let i = 0; i < 15; i++) {
			venues.push(
				makeVenue({
					id: 5000 + i,
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
					id: 5100 + i,
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
			makeVenue({ id: 6000, capacity: 50 }),
			makeVenue({ id: 6001, capacity: 50 }),
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
