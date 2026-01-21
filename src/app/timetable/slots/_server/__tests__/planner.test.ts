import { describe, expect, it } from 'vitest';
import type { AllocationRecord, DayOfWeek, VenueRecord } from '../planner';
import { buildTermPlan } from '../planner';

let allocationId = 1;
let semesterModuleId = 1;
let semesterId = 1;
let venueId = 1;
let moduleId = 1000;

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
		userId: overrides.userId ?? 'lecturer-1',
		semesterModuleId: semesterModule.id,
		duration: overrides.duration ?? 120,
		classType: overrides.classType ?? 'lecture',
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

describe('buildTermPlan - Basic Allocation', () => {
	it('schedules a single allocation at earliest feasible slot', () => {
		const allocation = makeAllocation({
			startTime: '08:30:00',
			endTime: '12:30:00',
			duration: 120,
		});
		const venues = [makeVenue({ id: 'venue-5' })];
		const plan = buildTermPlan(1, [allocation], venues);

		expect(plan).toHaveLength(1);
		expect(plan[0].venueId).toBe('venue-5');
		expect(plan[0].allocationIds).toEqual([allocation.id]);
		const slotDuration =
			timeToMinutes(plan[0].endTime) - timeToMinutes(plan[0].startTime);
		expect(slotDuration).toBe(120);
	});

	it('schedules multiple independent allocations in same venue on different time slots', () => {
		const alloc1 = makeAllocation({ duration: 60 });
		const alloc2 = makeAllocation({ duration: 60 });
		const venue = makeVenue({ capacity: 100 });

		const plan = buildTermPlan(1, [alloc1, alloc2], [venue]);

		expect(plan.length).toBeGreaterThanOrEqual(2);
		const slots = plan.map((p) => ({
			start: timeToMinutes(p.startTime),
			end: timeToMinutes(p.endTime),
		}));

		for (let i = 0; i < slots.length; i++) {
			for (let j = i + 1; j < slots.length; j++) {
				const noOverlap =
					slots[i].end <= slots[j].start || slots[j].end <= slots[i].start;
				expect(noOverlap).toBe(true);
			}
		}
	});

	it('allocates different classes on different days when same venue is needed', () => {
		const semester1 = nextSemesterId();
		const semester2 = nextSemesterId();

		const alloc1 = makeAllocation({
			allowedDays: ['monday', 'tuesday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: semester1,
				module: { id: nextModuleId() },
			},
		});

		const alloc2 = makeAllocation({
			allowedDays: ['monday', 'tuesday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: semester2,
				module: { id: nextModuleId() },
			},
		});

		const venue = makeVenue({ capacity: 100 });
		const plan = buildTermPlan(1, [alloc1, alloc2], [venue]);

		expect(plan.length).toBeGreaterThanOrEqual(2);
	});
});

describe('buildTermPlan - Venue Constraints', () => {
	it('respects venue type requirements', () => {
		const labTypeId = 'type-10';
		const lectureTypeId = 'type-11';

		const allocation = makeAllocation({
			numberOfStudents: 40,
			timetableAllocationVenueTypes: [{ venueTypeId: labTypeId }],
		});

		const venues = [
			makeVenue({
				id: 'venue-1',
				typeId: lectureTypeId,
				type: {
					id: lectureTypeId,
					name: 'Lecture',
					description: null,
					createdAt: new Date(),
				},
			}),
			makeVenue({
				id: 'venue-2',
				typeId: labTypeId,
				type: {
					id: labTypeId,
					name: 'Lab',
					description: null,
					createdAt: new Date(),
				},
			}),
		];

		const plan = buildTermPlan(1, [allocation], venues);
		expect(plan).toHaveLength(1);
		expect(plan[0].venueId).toBe('venue-2');
	});

	it('allows up to 10% capacity overflow but not beyond', () => {
		const allocation = makeAllocation({ numberOfStudents: 55 });
		const tightVenue = makeVenue({ id: 'venue-3', capacity: 50 });
		const ampleVenue = makeVenue({ id: 'venue-4', capacity: 80 });

		const plan = buildTermPlan(1, [allocation], [tightVenue, ampleVenue]);
		expect(['venue-3', 'venue-4']).toContain(plan[0].venueId);

		const overLimitAllocation = makeAllocation({ numberOfStudents: 120 });
		expect(() =>
			buildTermPlan(1, [overLimitAllocation], [tightVenue])
		).toThrow();
	});

	it('never exceeds 10% capacity overflow for any slot', () => {
		const baseCapacity = 100;
		const venue = makeVenue({ id: 'venue-30', capacity: baseCapacity });
		const moduleIdValue = nextModuleId();
		const semesterModuleIdValue = nextSemesterModuleId();

		const first = makeAllocation({
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue },
			},
			semesterModuleId: semesterModuleIdValue,
			userId: 'lecturer-same',
			duration: 60,
			numberOfStudents: 55,
		});

		const second = makeAllocation({
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue },
			},
			semesterModuleId: semesterModuleIdValue,
			userId: 'lecturer-same',
			duration: 60,
			numberOfStudents: 55,
		});

		const plan = buildTermPlan(1, [first, second], [venue]);
		const maxCapacity = Math.floor(baseCapacity * 1.1);

		for (const slot of plan) {
			expect(slot.capacityUsed).toBeLessThanOrEqual(maxCapacity);
		}
	});
});

describe('buildTermPlan - Lecturer Constraints', () => {
	it('prevents lecturer from teaching different modules at the same time', () => {
		const lecturerId = 'lecturer-conflict-test';
		const semester1 = nextSemesterId();

		const module1 = nextModuleId();
		const module2 = nextModuleId();

		const alloc1 = makeAllocation({
			userId: lecturerId,
			allowedDays: ['monday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: semester1,
				module: { id: module1, name: 'Computer Science 101' },
			},
			duration: 120,
		});

		const alloc2 = makeAllocation({
			userId: lecturerId,
			allowedDays: ['monday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: semester1,
				module: { id: module2, name: 'Computer Science 201' },
			},
			duration: 120,
		});

		const venues = [
			makeVenue({ id: 'venue-50' }),
			makeVenue({ id: 'venue-51' }),
		];
		const plan = buildTermPlan(1, [alloc1, alloc2], venues);

		expect(plan.length).toBe(2);

		const slots = plan.map((p) => ({
			start: timeToMinutes(p.startTime),
			end: timeToMinutes(p.endTime),
			day: p.dayOfWeek,
		}));

		const slot1 = slots[0];
		const slot2 = slots[1];

		if (slot1.day === slot2.day) {
			const noOverlap = slot1.end <= slot2.start || slot2.end <= slot1.start;
			expect(noOverlap).toBe(true);
		}
	});

	it('allows same lecturer to share slot for same module with different groups', () => {
		const lecturerId = 'lecturer-shared';
		const moduleIdValue = nextModuleId();
		const moduleName = 'Engineering 101';
		const semesterModuleIdValue = nextSemesterModuleId();

		const group1 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 90,
			groupName: 'Group A',
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
			duration: 90,
			groupName: 'Group B',
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const plan = buildTermPlan(
			1,
			[group1, group2],
			[makeVenue({ capacity: 80 })]
		);

		expect(plan).toHaveLength(1);
		expect(plan[0].allocationIds.sort()).toEqual([group1.id, group2.id].sort());
		expect(plan[0].capacityUsed).toBe(60);
	});
});

describe('buildTermPlan - Class Constraints', () => {
	it('prevents class from having overlapping slots', () => {
		const semesterIdValue = nextSemesterId();

		const module1 = nextModuleId();
		const module2 = nextModuleId();

		const alloc1 = makeAllocation({
			userId: 'lecturer-1',
			allowedDays: ['monday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: semesterIdValue,
				module: { id: module1 },
			},
			duration: 120,
		});

		const alloc2 = makeAllocation({
			userId: 'lecturer-2',
			allowedDays: ['monday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: semesterIdValue,
				module: { id: module2 },
			},
			duration: 120,
		});

		const venues = [
			makeVenue({ id: 'venue-60' }),
			makeVenue({ id: 'venue-61' }),
		];
		const plan = buildTermPlan(1, [alloc1, alloc2], venues);

		expect(plan.length).toBe(2);

		const slots = plan.map((p) => ({
			start: timeToMinutes(p.startTime),
			end: timeToMinutes(p.endTime),
			day: p.dayOfWeek,
		}));

		const slot1 = slots[0];
		const slot2 = slots[1];

		if (slot1.day === slot2.day) {
			const noOverlap = slot1.end <= slot2.start || slot2.end <= slot1.start;
			expect(noOverlap).toBe(true);
		}
	});

	it('allows different semesters (classes) to have overlapping slots', () => {
		const semester1 = nextSemesterId();
		const semester2 = nextSemesterId();

		const alloc1 = makeAllocation({
			allowedDays: ['monday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: semester1,
				module: { id: nextModuleId() },
			},
		});

		const alloc2 = makeAllocation({
			allowedDays: ['monday'],
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: semester2,
				module: { id: nextModuleId() },
			},
		});

		const venues = [
			makeVenue({ id: 'venue-70' }),
			makeVenue({ id: 'venue-71' }),
		];
		const plan = buildTermPlan(1, [alloc1, alloc2], venues);

		expect(plan.length).toBeGreaterThanOrEqual(2);
	});

	it('allows different groups within same class to overlap', () => {
		const semesterIdValue = nextSemesterId();
		const moduleIdValue = nextModuleId();
		const semesterModuleIdValue = nextSemesterModuleId();

		const groupA = makeAllocation({
			userId: 'lecturer-group-a',
			groupName: 'A',
			allowedDays: ['monday'],
			startTime: '08:30:00',
			endTime: '10:30:00',
			duration: 120,
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: semesterIdValue,
				module: { id: moduleIdValue, name: 'Group Module' },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const groupB = makeAllocation({
			userId: 'lecturer-group-b',
			groupName: 'B',
			allowedDays: ['monday'],
			startTime: '08:30:00',
			endTime: '10:30:00',
			duration: 120,
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: semesterIdValue,
				module: { id: moduleIdValue, name: 'Group Module' },
			},
		});

		const venues = [
			makeVenue({ id: 'venue-group-1' }),
			makeVenue({ id: 'venue-group-2' }),
		];
		const plan = buildTermPlan(1, [groupA, groupB], venues);

		expect(plan).toHaveLength(2);
		const startTimes = new Set(plan.map((slot) => slot.startTime));
		expect(startTimes.size).toBe(1);
	});

	it('prevents class-wide allocation from overlapping group allocation', () => {
		const semesterIdValue = nextSemesterId();
		const moduleIdValue = nextModuleId();
		const semesterModuleIdValue = nextSemesterModuleId();

		const classWide = makeAllocation({
			userId: 'lecturer-class-wide',
			groupName: null,
			allowedDays: ['monday'],
			startTime: '08:30:00',
			endTime: '14:30:00',
			duration: 120,
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: semesterIdValue,
				module: { id: moduleIdValue, name: 'Class Module' },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const groupA = makeAllocation({
			userId: 'lecturer-class-group',
			groupName: 'A',
			allowedDays: ['monday'],
			startTime: '08:30:00',
			endTime: '14:30:00',
			duration: 120,
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: semesterIdValue,
				module: { id: moduleIdValue, name: 'Class Module' },
			},
		});

		const venues = [
			makeVenue({ id: 'venue-class-1' }),
			makeVenue({ id: 'venue-class-2' }),
		];
		const plan = buildTermPlan(1, [classWide, groupA], venues);

		expect(plan).toHaveLength(2);
		const slots = plan.map((p) => ({
			start: timeToMinutes(p.startTime),
			end: timeToMinutes(p.endTime),
			day: p.dayOfWeek,
		}));

		const slot1 = slots[0];
		const slot2 = slots[1];
		if (slot1.day === slot2.day) {
			const noOverlap = slot1.end <= slot2.start || slot2.end <= slot1.start;
			expect(noOverlap).toBe(true);
		}
	});
});

describe('buildTermPlan - Consecutive Slots Constraint', () => {
	it('avoids scheduling 3 consecutive slots for lecturer when alternatives exist', () => {
		const lecturerId = 'lecturer-consecutive';
		const semesterIdValue = nextSemesterId();

		const allocations = [];
		for (let i = 0; i < 5; i++) {
			allocations.push(
				makeAllocation({
					userId: lecturerId,
					duration: 60,
					allowedDays: ['monday', 'tuesday', 'wednesday'],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: semesterIdValue,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = [
			makeVenue({ id: 'venue-80' }),
			makeVenue({ id: 'venue-81' }),
			makeVenue({ id: 'venue-82' }),
		];
		const plan = buildTermPlan(1, allocations, venues, 5);

		const lecturerSlots = plan.map((p) => ({
			start: timeToMinutes(p.startTime),
			end: timeToMinutes(p.endTime),
			day: p.dayOfWeek,
		}));

		lecturerSlots.sort((a, b) => {
			if (a.day !== b.day) {
				return a.day.localeCompare(b.day);
			}
			return a.start - b.start;
		});

		for (const day of ['monday', 'tuesday', 'wednesday'] as DayOfWeek[]) {
			const daySlots = lecturerSlots.filter((s) => s.day === day);
			daySlots.sort((a, b) => a.start - b.start);

			let consecutiveCount = 1;
			for (let i = 1; i < daySlots.length; i++) {
				if (daySlots[i].start === daySlots[i - 1].end) {
					consecutiveCount++;
					expect(consecutiveCount).toBeLessThanOrEqual(2);
				} else {
					consecutiveCount = 1;
				}
			}
		}
	});

	it('avoids scheduling 3 consecutive slots for class when alternatives exist', () => {
		const semesterIdValue = nextSemesterId();

		const allocations = [];
		for (let i = 0; i < 5; i++) {
			allocations.push(
				makeAllocation({
					userId: `lecturer-${i}`,
					duration: 60,
					allowedDays: ['monday', 'tuesday', 'wednesday'],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: semesterIdValue,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = [
			makeVenue({ id: 'venue-90' }),
			makeVenue({ id: 'venue-91' }),
			makeVenue({ id: 'venue-92' }),
		];
		const plan = buildTermPlan(1, allocations, venues, 5);

		const classSlots = plan.map((p) => ({
			start: timeToMinutes(p.startTime),
			end: timeToMinutes(p.endTime),
			day: p.dayOfWeek,
		}));

		classSlots.sort((a, b) => {
			if (a.day !== b.day) {
				return a.day.localeCompare(b.day);
			}
			return a.start - b.start;
		});

		for (const day of ['monday', 'tuesday', 'wednesday'] as DayOfWeek[]) {
			const daySlots = classSlots.filter((s) => s.day === day);
			daySlots.sort((a, b) => a.start - b.start);

			let consecutiveCount = 1;
			for (let i = 1; i < daySlots.length; i++) {
				if (daySlots[i].start === daySlots[i - 1].end) {
					consecutiveCount++;
					expect(consecutiveCount).toBeLessThanOrEqual(2);
				} else {
					consecutiveCount = 1;
				}
			}
		}
	});
});

describe('buildTermPlan - Max Slots Per Day Constraint', () => {
	it('respects maxSlotsPerDay for lecturers', () => {
		const lecturerId = 'lecturer-max-slots';
		const maxSlotsPerDay = 2;

		const allocations = [];
		for (let i = 0; i < 5; i++) {
			allocations.push(
				makeAllocation({
					userId: lecturerId,
					duration: 60,
					allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: null,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = [
			makeVenue({ id: 'venue-100' }),
			makeVenue({ id: 'venue-101' }),
			makeVenue({ id: 'venue-102' }),
		];
		const plan = buildTermPlan(1, allocations, venues, maxSlotsPerDay);

		const slotsByDay = new Map<string, number>();

		for (const slot of plan) {
			const count = slotsByDay.get(slot.dayOfWeek) ?? 0;
			slotsByDay.set(slot.dayOfWeek, count + 1);
		}

		for (const count of slotsByDay.values()) {
			expect(count).toBeLessThanOrEqual(maxSlotsPerDay);
		}
	});

	it('respects maxSlotsPerDay for classes', () => {
		const semesterIdValue = nextSemesterId();
		const maxSlotsPerDay = 2;

		const allocations = [];
		for (let i = 0; i < 5; i++) {
			allocations.push(
				makeAllocation({
					userId: `lecturer-${i}`,
					duration: 60,
					allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: semesterIdValue,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const venues = [
			makeVenue({ id: 'venue-110' }),
			makeVenue({ id: 'venue-111' }),
			makeVenue({ id: 'venue-112' }),
		];
		const plan = buildTermPlan(1, allocations, venues, maxSlotsPerDay);

		const slotsByDay = new Map<string, number>();

		for (const slot of plan) {
			const count = slotsByDay.get(slot.dayOfWeek) ?? 0;
			slotsByDay.set(slot.dayOfWeek, count + 1);
		}

		for (const count of slotsByDay.values()) {
			expect(count).toBeLessThanOrEqual(maxSlotsPerDay);
		}
	});
});

describe('buildTermPlan - Time and Day Constraints', () => {
	it('respects allowed days for each allocation', () => {
		const allocation = makeAllocation({
			allowedDays: ['wednesday'],
			startTime: '10:00:00',
			endTime: '16:00:00',
			duration: 120,
		});

		const plan = buildTermPlan(
			1,
			[allocation],
			[makeVenue({ id: 'venue-120' })]
		);

		expect(plan).toHaveLength(1);
		expect(plan[0].dayOfWeek).toBe('wednesday');
	});

	it('respects time windows for each allocation', () => {
		const allocation = makeAllocation({
			startTime: '14:00:00',
			endTime: '17:00:00',
			duration: 120,
		});

		const plan = buildTermPlan(
			1,
			[allocation],
			[makeVenue({ id: 'venue-130' })]
		);

		expect(plan).toHaveLength(1);

		const slotStart = timeToMinutes(plan[0].startTime);
		const slotEnd = timeToMinutes(plan[0].endTime);
		const windowStart = timeToMinutes(allocation.startTime);
		const windowEnd = timeToMinutes(allocation.endTime);

		expect(slotStart).toBeGreaterThanOrEqual(windowStart);
		expect(slotEnd).toBeLessThanOrEqual(windowEnd);
	});

	it('throws when time window cannot fit duration', () => {
		const impossible = makeAllocation({
			startTime: '08:00:00',
			endTime: '09:00:00',
			duration: 90,
		});

		expect(() => buildTermPlan(1, [impossible], [makeVenue({})])).toThrow();
	});
});

describe('buildTermPlan - Stress Tests', () => {
	it('schedules many allocations without violating constraints', () => {
		const maxSlotsPerDay = 3;
		const venues = [
			makeVenue({ id: 'venue-200', capacity: 80 }),
			makeVenue({ id: 'venue-201', capacity: 100 }),
			makeVenue({ id: 'venue-202', capacity: 120 }),
			makeVenue({ id: 'venue-203', capacity: 60 }),
		];

		const allocations: AllocationRecord[] = [];

		for (let i = 0; i < 20; i++) {
			const semesterIdValue = i % 5;
			allocations.push(
				makeAllocation({
					userId: `lecturer-${i % 8}`,
					allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday'],
					startTime: '08:00:00',
					endTime: '18:00:00',
					duration: 60 + (i % 4) * 30,
					numberOfStudents: 30 + (i % 5) * 10,
					semesterModule: {
						id: nextSemesterModuleId(),
						semesterId: semesterIdValue,
						module: { id: nextModuleId() },
					},
				})
			);
		}

		const plan = buildTermPlan(1, allocations, venues, maxSlotsPerDay);

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

	it('handles complex scenario with multiple constraints simultaneously', () => {
		const semester1 = nextSemesterId();
		const semester2 = nextSemesterId();
		const lecturer1 = 'stress-lecturer-1';
		const lecturer2 = 'stress-lecturer-2';

		const labTypeId = 'type-50';
		const lectureTypeId = 'type-51';

		const allocations: AllocationRecord[] = [
			makeAllocation({
				userId: lecturer1,
				allowedDays: ['monday', 'wednesday'],
				startTime: '08:00:00',
				endTime: '12:00:00',
				duration: 120,
				numberOfStudents: 100,
				semesterModule: {
					id: nextSemesterModuleId(),
					semesterId: semester1,
					module: { id: nextModuleId() },
				},
				timetableAllocationVenueTypes: [{ venueTypeId: lectureTypeId }],
			}),
			makeAllocation({
				userId: lecturer1,
				allowedDays: ['monday', 'wednesday'],
				startTime: '13:00:00',
				endTime: '17:00:00',
				duration: 90,
				numberOfStudents: 100,
				semesterModule: {
					id: nextSemesterModuleId(),
					semesterId: semester1,
					module: { id: nextModuleId() },
				},
			}),
			makeAllocation({
				userId: lecturer2,
				allowedDays: ['monday', 'tuesday'],
				startTime: '09:00:00',
				endTime: '15:00:00',
				duration: 120,
				numberOfStudents: 50,
				semesterModule: {
					id: nextSemesterModuleId(),
					semesterId: semester2,
					module: { id: nextModuleId() },
				},
				timetableAllocationVenueTypes: [{ venueTypeId: labTypeId }],
			}),
			makeAllocation({
				userId: lecturer2,
				allowedDays: ['tuesday', 'thursday'],
				startTime: '08:00:00',
				endTime: '14:00:00',
				duration: 180,
				numberOfStudents: 50,
				semesterModule: {
					id: nextSemesterModuleId(),
					semesterId: semester2,
					module: { id: nextModuleId() },
				},
			}),
		];

		const venues = [
			makeVenue({
				id: 'venue-300',
				capacity: 120,
				typeId: lectureTypeId,
				type: {
					id: lectureTypeId,
					name: 'Lecture Hall',
					description: null,
					createdAt: new Date(),
				},
			}),
			makeVenue({
				id: 'venue-301',
				capacity: 60,
				typeId: labTypeId,
				type: {
					id: labTypeId,
					name: 'Lab',
					description: null,
					createdAt: new Date(),
				},
			}),
			makeVenue({
				id: 'venue-302',
				capacity: 100,
				typeId: lectureTypeId,
				type: {
					id: lectureTypeId,
					name: 'Lecture Hall 2',
					description: null,
					createdAt: new Date(),
				},
			}),
		];

		const plan = buildTermPlan(1, allocations, venues, 3);

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

describe('buildTermPlan - Edge Cases', () => {
	it('throws when required venue type is unavailable', () => {
		const restricted = makeAllocation({
			timetableAllocationVenueTypes: [{ venueTypeId: 'type-999' }],
		});

		expect(() =>
			buildTermPlan(1, [restricted], [makeVenue({ typeId: 'type-1' })])
		).toThrow();
	});

	it('handles variable duration slots correctly', () => {
		const allocations = [
			makeAllocation({
				duration: 30,
				allowedDays: ['monday', 'tuesday'],
			}),
			makeAllocation({
				duration: 90,
				allowedDays: ['monday', 'tuesday'],
			}),
			makeAllocation({
				duration: 150,
				allowedDays: ['monday', 'tuesday'],
			}),
			makeAllocation({
				duration: 210,
				allowedDays: ['monday', 'tuesday'],
			}),
		];

		const venues = [
			makeVenue({ id: 'venue-400' }),
			makeVenue({ id: 'venue-401' }),
		];
		const plan = buildTermPlan(1, allocations, venues);

		expect(plan.length).toBeGreaterThanOrEqual(4);

		for (let i = 0; i < plan.length; i++) {
			const duration =
				timeToMinutes(plan[i].endTime) - timeToMinutes(plan[i].startTime);
			const originalAlloc = allocations.find((a) =>
				plan[i].allocationIds.includes(a.id)
			);
			if (originalAlloc) {
				expect(duration).toBe(originalAlloc.duration);
			}
		}
	});

	it('never overlaps slots for the same venue and day', () => {
		const venue = makeVenue({ id: 'venue-500', capacity: 200 });
		const allocations = [
			makeAllocation({
				duration: 90,
				allowedDays: ['monday', 'tuesday'],
			}),
			makeAllocation({
				duration: 120,
				allowedDays: ['monday', 'tuesday'],
			}),
			makeAllocation({
				duration: 60,
				allowedDays: ['monday', 'tuesday'],
			}),
			makeAllocation({
				duration: 150,
				allowedDays: ['monday', 'tuesday'],
			}),
		];

		const plan = buildTermPlan(1, allocations, [venue]);

		const grouped: Record<string, Array<{ start: number; end: number }>> = {};

		for (const slot of plan) {
			const key = `${slot.venueId}-${slot.dayOfWeek}`;
			const list = grouped[key] ?? [];
			list.push({
				start: timeToMinutes(slot.startTime),
				end: timeToMinutes(slot.endTime),
			});
			grouped[key] = list;
		}

		for (const key of Object.keys(grouped)) {
			const sorted = grouped[key].sort((a, b) => a.start - b.start);
			for (let i = 1; i < sorted.length; i++) {
				expect(sorted[i - 1].end).toBeLessThanOrEqual(sorted[i].start);
			}
		}
	});

	it('fills gaps efficiently to minimize idle time', () => {
		const venue = makeVenue({ id: 'venue-600' });

		const first = makeAllocation({
			duration: 120,
			startTime: '08:30:00',
			endTime: '14:30:00',
		});

		const second = makeAllocation({
			duration: 120,
			startTime: '08:30:00',
			endTime: '14:30:00',
		});

		const third = makeAllocation({
			duration: 120,
			startTime: '08:30:00',
			endTime: '14:30:00',
		});

		const plan = buildTermPlan(1, [first, second, third], [venue]);

		expect(plan).toHaveLength(3);
		const slots = plan
			.map((slot) => ({
				start: timeToMinutes(slot.startTime),
				end: timeToMinutes(slot.endTime),
			}))
			.sort((a, b) => a.start - b.start);

		for (let i = 0; i < slots.length - 1; i++) {
			expect(slots[i].end).toBeLessThanOrEqual(slots[i + 1].start);
		}
	});

	it('prefers alternate days when primary day is saturated', () => {
		const venue = makeVenue({ id: 'venue-700' });

		const morning = makeAllocation({
			allowedDays: ['monday'],
			startTime: '08:30:00',
			endTime: '14:30:00',
			duration: 120,
		});

		const afternoon = makeAllocation({
			allowedDays: ['monday'],
			startTime: '08:30:00',
			endTime: '16:30:00',
			duration: 120,
		});

		const evening = makeAllocation({
			allowedDays: ['monday'],
			startTime: '08:30:00',
			endTime: '17:30:00',
			duration: 120,
		});

		const flexible = makeAllocation({
			allowedDays: ['monday', 'tuesday'],
			startTime: '08:30:00',
			endTime: '17:30:00',
			duration: 120,
		});

		const plan = buildTermPlan(
			1,
			[morning, afternoon, evening, flexible],
			[venue]
		);

		const flexibleSlot = plan.find((slot) =>
			slot.allocationIds.includes(flexible.id)
		);
		expect(flexibleSlot?.dayOfWeek).toBe('tuesday');
	});
});

describe('buildTermPlan - Validation', () => {
	it('ensures all allocations are placed in final plan', () => {
		const allocations = [
			makeAllocation({ duration: 60 }),
			makeAllocation({ duration: 90 }),
			makeAllocation({ duration: 120 }),
		];

		const venues = [
			makeVenue({ id: 'venue-800' }),
			makeVenue({ id: 'venue-801' }),
		];
		const plan = buildTermPlan(1, allocations, venues);

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

	it('ensures no slot has zero allocations', () => {
		const allocations = [
			makeAllocation({ duration: 60 }),
			makeAllocation({ duration: 60 }),
		];

		const plan = buildTermPlan(1, allocations, [
			makeVenue({ id: 'venue-900' }),
		]);

		for (const slot of plan) {
			expect(slot.allocationIds.length).toBeGreaterThan(0);
		}
	});
});

describe('buildTermPlan - School-Based Venue Filtering', () => {
	it("only allocates venues from lecturer's schools", () => {
		const schoolId1 = 100;
		const schoolId2 = 200;

		const allocation = makeAllocation({
			numberOfStudents: 50,
			user: {
				userSchools: [{ schoolId: schoolId1 }],
			},
		});

		const venues = [
			makeVenue({
				id: 'venue-1001',
				capacity: 60,
				venueSchools: [{ schoolId: schoolId1 }],
			}),
			makeVenue({
				id: 'venue-1002',
				capacity: 60,
				venueSchools: [{ schoolId: schoolId2 }],
			}),
		];

		const plan = buildTermPlan(1, [allocation], venues);

		expect(plan).toHaveLength(1);
		expect(plan[0].venueId).toBe('venue-1001');
	});

	it('allows lecturer with multiple schools to use any of their school venues', () => {
		const schoolId1 = 100;
		const schoolId2 = 200;
		const schoolId3 = 300;

		const allocation = makeAllocation({
			numberOfStudents: 50,
			user: {
				userSchools: [{ schoolId: schoolId1 }, { schoolId: schoolId2 }],
			},
		});

		const venues = [
			makeVenue({
				id: 'venue-2001',
				capacity: 60,
				venueSchools: [{ schoolId: schoolId1 }],
			}),
			makeVenue({
				id: 'venue-2002',
				capacity: 60,
				venueSchools: [{ schoolId: schoolId2 }],
			}),
			makeVenue({
				id: 'venue-2003',
				capacity: 60,
				venueSchools: [{ schoolId: schoolId3 }],
			}),
		];

		const plan = buildTermPlan(1, [allocation], venues);

		expect(plan).toHaveLength(1);
		expect(['venue-2001', 'venue-2002']).toContain(plan[0].venueId);
		expect(plan[0].venueId).not.toBe('venue-2003');
	});

	it('allows venue shared by multiple schools if one matches lecturer school', () => {
		const schoolId1 = 100;
		const schoolId2 = 200;

		const allocation = makeAllocation({
			numberOfStudents: 50,
			user: {
				userSchools: [{ schoolId: schoolId1 }],
			},
		});

		const sharedVenue = makeVenue({
			id: 'venue-3001',
			capacity: 60,
			venueSchools: [{ schoolId: schoolId1 }, { schoolId: schoolId2 }],
		});

		const plan = buildTermPlan(1, [allocation], [sharedVenue]);

		expect(plan).toHaveLength(1);
		expect(plan[0].venueId).toBe('venue-3001');
	});

	it("throws error when no venues match lecturer's schools", () => {
		const schoolId1 = 100;
		const schoolId2 = 200;

		const allocation = makeAllocation({
			numberOfStudents: 50,
			user: {
				userSchools: [{ schoolId: schoolId1 }],
			},
		});

		const venues = [
			makeVenue({
				id: 'venue-4001',
				capacity: 100,
				venueSchools: [{ schoolId: schoolId2 }],
			}),
		];

		expect(() => buildTermPlan(1, [allocation], venues)).toThrow();
	});

	it('correctly filters venues for multiple lecturers with different schools', () => {
		const schoolId1 = 100;
		const schoolId2 = 200;

		const alloc1 = makeAllocation({
			userId: 'lecturer-school-1',
			numberOfStudents: 50,
			user: {
				userSchools: [{ schoolId: schoolId1 }],
			},
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: nextModuleId() },
			},
		});

		const alloc2 = makeAllocation({
			userId: 'lecturer-school-2',
			numberOfStudents: 50,
			user: {
				userSchools: [{ schoolId: schoolId2 }],
			},
			semesterModule: {
				id: nextSemesterModuleId(),
				semesterId: null,
				module: { id: nextModuleId() },
			},
		});

		const venues = [
			makeVenue({
				id: 'venue-5001',
				capacity: 60,
				venueSchools: [{ schoolId: schoolId1 }],
			}),
			makeVenue({
				id: 'venue-5002',
				capacity: 60,
				venueSchools: [{ schoolId: schoolId2 }],
			}),
		];

		const plan = buildTermPlan(1, [alloc1, alloc2], venues);

		expect(plan).toHaveLength(2);

		const slot1 = plan.find((p) => p.allocationIds.includes(alloc1.id));
		const slot2 = plan.find((p) => p.allocationIds.includes(alloc2.id));

		expect(slot1?.venueId).toBe('venue-5001');
		expect(slot2?.venueId).toBe('venue-5002');
	});

	it('handles complex scenario with school filtering and venue type requirements', () => {
		const schoolId1 = 100;
		const schoolId2 = 200;
		const labTypeId = 'type-50';
		const lectureTypeId = 'type-51';

		const allocation = makeAllocation({
			numberOfStudents: 50,
			user: {
				userSchools: [{ schoolId: schoolId1 }],
			},
			timetableAllocationVenueTypes: [{ venueTypeId: labTypeId }],
		});

		const venues = [
			makeVenue({
				id: 'venue-6001',
				capacity: 60,
				typeId: labTypeId,
				type: {
					id: labTypeId,
					name: 'Lab',
					description: null,
					createdAt: new Date(),
				},
				venueSchools: [{ schoolId: schoolId2 }],
			}),
			makeVenue({
				id: 'venue-6002',
				capacity: 60,
				typeId: labTypeId,
				type: {
					id: labTypeId,
					name: 'Lab',
					description: null,
					createdAt: new Date(),
				},
				venueSchools: [{ schoolId: schoolId1 }],
			}),
			makeVenue({
				id: 'venue-6003',
				capacity: 60,
				typeId: lectureTypeId,
				type: {
					id: lectureTypeId,
					name: 'Lecture',
					description: null,
					createdAt: new Date(),
				},
				venueSchools: [{ schoolId: schoolId1 }],
			}),
		];

		const plan = buildTermPlan(1, [allocation], venues);

		expect(plan).toHaveLength(1);
		expect(plan[0].venueId).toBe('venue-6002');
	});
});

describe('buildTermPlan - Class Type Constraints', () => {
	it('prevents lecturer from having different class types at overlapping times even for same module', () => {
		const lecturerId = 'lecturer-classtype-test';
		const moduleIdValue = nextModuleId();
		const moduleName = 'Computer Science 101';
		const semesterModuleIdValue = nextSemesterModuleId();

		const lectureAlloc = makeAllocation({
			userId: lecturerId,
			allowedDays: ['monday'],
			classType: 'lecture',
			duration: 120,
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const tutorialAlloc = makeAllocation({
			userId: lecturerId,
			allowedDays: ['monday'],
			classType: 'tutorial',
			duration: 120,
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const venues = [
			makeVenue({ id: 'venue-950' }),
			makeVenue({ id: 'venue-951' }),
		];
		const plan = buildTermPlan(1, [lectureAlloc, tutorialAlloc], venues);

		expect(plan.length).toBe(2);

		const slots = plan.map((p) => ({
			start: timeToMinutes(p.startTime),
			end: timeToMinutes(p.endTime),
			day: p.dayOfWeek,
		}));

		const slot1 = slots[0];
		const slot2 = slots[1];

		if (slot1.day === slot2.day) {
			const noOverlap = slot1.end <= slot2.start || slot2.end <= slot1.start;
			expect(noOverlap).toBe(true);
		}
	});

	it('allows same lecturer to combine allocations with same class type and module', () => {
		const lecturerId = 'lecturer-same-classtype';
		const moduleIdValue = nextModuleId();
		const moduleName = 'Engineering 101';
		const semesterModuleIdValue = nextSemesterModuleId();

		const lecture1 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 90,
			classType: 'lecture',
			groupName: 'Group A',
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const lecture2 = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 90,
			classType: 'lecture',
			groupName: 'Group B',
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const plan = buildTermPlan(
			1,
			[lecture1, lecture2],
			[makeVenue({ capacity: 80 })]
		);

		expect(plan).toHaveLength(1);
		expect(plan[0].allocationIds.sort()).toEqual(
			[lecture1.id, lecture2.id].sort()
		);
		expect(plan[0].capacityUsed).toBe(60);
	});

	it('does not combine allocations with different class types even if same module and lecturer', () => {
		const lecturerId = 'lecturer-mixed-classtype';
		const moduleIdValue = nextModuleId();
		const moduleName = 'Physics 101';
		const semesterModuleIdValue = nextSemesterModuleId();

		const lecture = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 90,
			classType: 'lecture',
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const lab = makeAllocation({
			userId: lecturerId,
			numberOfStudents: 30,
			duration: 90,
			classType: 'lab',
			semesterModule: {
				id: semesterModuleIdValue,
				semesterId: null,
				module: { id: moduleIdValue, name: moduleName },
			},
			semesterModuleId: semesterModuleIdValue,
		});

		const plan = buildTermPlan(
			1,
			[lecture, lab],
			[makeVenue({ capacity: 80 })]
		);

		expect(plan.length).toBeGreaterThanOrEqual(2);

		for (const slot of plan) {
			expect(slot.allocationIds.length).toBeLessThanOrEqual(1);
		}
	});
});
