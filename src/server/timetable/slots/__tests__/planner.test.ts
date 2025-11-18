import { describe, expect, it } from 'vitest';
import type { AllocationRecord, DayOfWeek, VenueRecord } from '../planner';
import { buildTermPlan } from '../planner';

let allocationId = 1;
let semesterModuleId = 1;
let venueId = 1;

function nextAllocationId() {
	const id = allocationId;
	allocationId += 1;
	return id;
}

function nextSemesterModuleId() {
	const id = semesterModuleId;
	semesterModuleId += 1;
	return id;
}

function nextVenueId() {
	const id = venueId;
	venueId += 1;
	return id;
}

function makeAllocation(
	overrides: Partial<AllocationRecord> = {}
): AllocationRecord {
	const id = overrides.id ?? nextAllocationId();
	const semesterModuleIdValue =
		overrides.semesterModuleId ?? nextSemesterModuleId();
	const moduleIdValue =
		overrides.semesterModule?.module.id ??
		overrides.semesterModuleId ??
		semesterModuleIdValue + 1000;
	const semesterModule = overrides.semesterModule ?? {
		id: semesterModuleIdValue,
		module: { id: moduleIdValue },
	};
	return {
		id,
		termId: overrides.termId ?? 1,
		userId: overrides.userId ?? 'lecturer-1',
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
	} as VenueRecord;
}

function timeToMinutes(time: string) {
	const [hours, minutes] = time.split(':');
	return Number(hours) * 60 + Number(minutes);
}

describe('buildTermPlan', () => {
	it('schedules a single allocation at earliest feasible slot', () => {
		const allocation = makeAllocation({
			startTime: '09:00:00',
			endTime: '12:00:00',
			duration: 120,
		});
		const venues = [makeVenue({ id: 5 })];
		const plan = buildTermPlan(1, [allocation], venues);
		expect(plan).toHaveLength(1);
		expect(plan[0].startTime).toBe('09:00:00');
		expect(plan[0].endTime).toBe('11:00:00');
		expect(plan[0].venueId).toBe(5);
		expect(plan[0].allocationIds).toEqual([allocation.id]);
	});

	it('respects venue type requirements', () => {
		const labTypeId = 10;
		const lectureTypeId = 11;
		const allocation = makeAllocation({
			numberOfStudents: 40,
			timetableAllocationVenueTypes: [{ venueTypeId: labTypeId }],
		});
		const venues = [
			makeVenue({
				id: 1,
				typeId: lectureTypeId,
				type: {
					id: lectureTypeId,
					name: 'Lecture',
					description: null,
					createdAt: new Date(),
				},
			}),
			makeVenue({
				id: 2,
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
		expect(plan[0].venueId).toBe(2);
	});

	it('allows up to ten percent capacity overflow but not beyond', () => {
		const allocation = makeAllocation({ numberOfStudents: 55 });
		const tightVenue = makeVenue({ id: 3, capacity: 50 });
		const ampleVenue = makeVenue({ id: 4, capacity: 80 });
		const plan = buildTermPlan(1, [allocation], [tightVenue, ampleVenue]);
		expect(plan[0].venueId).toBe(3);
		const overLimitAllocation = makeAllocation({ numberOfStudents: 120 });
		expect(() =>
			buildTermPlan(1, [overLimitAllocation], [tightVenue])
		).toThrow();
	});

	it('combines allocations for the same module into a single slot', () => {
		const moduleId = nextSemesterModuleId();
		const first = makeAllocation({
			duration: 90,
			numberOfStudents: 20,
			semesterModule: { id: moduleId, module: { id: 200 } },
			semesterModuleId: moduleId,
		});
		const second = makeAllocation({
			duration: 90,
			numberOfStudents: 20,
			semesterModule: { id: moduleId, module: { id: 200 } },
			semesterModuleId: moduleId,
		});
		const plan = buildTermPlan(
			1,
			[first, second],
			[makeVenue({ capacity: 50 })]
		);
		expect(plan).toHaveLength(1);
		expect(plan[0].allocationIds.sort()).toEqual([first.id, second.id].sort());
		expect(plan[0].capacityUsed).toBe(
			first.numberOfStudents + second.numberOfStudents
		);
	});

	it('redistributes flexible allocations when a constrained slot appears', () => {
		const constrainedTypeId = 7;
		const constrainedVenue = makeVenue({
			id: 1,
			typeId: constrainedTypeId,
			type: {
				id: constrainedTypeId,
				name: 'Studio',
				description: null,
				createdAt: new Date(),
			},
		});
		const generalVenue = makeVenue({ id: 2, typeId: constrainedTypeId });
		const flexibleA = makeAllocation({
			allowedDays: ['monday'],
			startTime: '08:00:00',
			endTime: '20:00:00',
		});
		const flexibleB = makeAllocation({
			allowedDays: ['monday'],
			startTime: '08:00:00',
			endTime: '20:00:00',
		});
		const constrained = makeAllocation({
			timetableAllocationVenueTypes: [{ venueTypeId: constrainedTypeId }],
			startTime: '08:00:00',
			endTime: '12:00:00',
			duration: 180,
		});
		const plan = buildTermPlan(
			1,
			[flexibleA, flexibleB, constrained],
			[constrainedVenue, generalVenue]
		);
		const slotForConstrained = plan.find((slot) =>
			slot.allocationIds.includes(constrained.id)
		);
		expect(slotForConstrained?.venueId).toBe(constrainedVenue.id);
		const flexibleVenues = plan
			.filter((slot) =>
				slot.allocationIds.some(
					(id) => id === flexibleA.id || id === flexibleB.id
				)
			)
			.map((slot) => slot.venueId);
		expect(flexibleVenues).toContain(generalVenue.id);
	});

	it('throws when allowed window cannot fit duration', () => {
		const impossible = makeAllocation({
			startTime: '08:00:00',
			endTime: '09:00:00',
			duration: 90,
		});
		expect(() => buildTermPlan(1, [impossible], [makeVenue({})])).toThrow();
	});

	it('fills gaps with five-minute granularity to minimize idle time', () => {
		const venue = makeVenue({ id: 9 });
		const early = makeAllocation({ duration: 60, endTime: '10:00:00' });
		const middle = makeAllocation({
			duration: 60,
			startTime: '08:30:00',
			endTime: '12:00:00',
		});
		const late = makeAllocation({
			duration: 60,
			startTime: '08:30:00',
			endTime: '12:00:00',
		});
		const plan = buildTermPlan(1, [early, middle, late], [venue]);
		const starts = plan.map((slot) => slot.startTime);
		expect(starts).toStrictEqual(['08:00:00', '09:00:00', '10:00:00']);
	});

	it('keeps distinct modules in separate slots even when durations match', () => {
		const venue = makeVenue({ id: 15, capacity: 200 });
		const first = makeAllocation({
			duration: 120,
			semesterModule: { id: 100, module: { id: 500 } },
			semesterModuleId: 100,
		});
		const second = makeAllocation({
			duration: 120,
			semesterModule: { id: 101, module: { id: 501 } },
			semesterModuleId: 101,
		});
		const plan = buildTermPlan(1, [first, second], [venue]);
		expect(plan).toHaveLength(2);
		const overlapping = plan.some((slotA, indexA) =>
			plan.some((slotB, indexB) => {
				if (indexA === indexB) {
					return false;
				}
				if (slotA.venueId !== slotB.venueId) {
					return false;
				}
				return !(
					slotA.endTime <= slotB.startTime || slotB.endTime <= slotA.startTime
				);
			})
		);
		expect(overlapping).toBe(false);
	});

	it('prefers alternate allowed days when primary day is saturated', () => {
		const venue = makeVenue({ id: 21 });
		const morning = makeAllocation({
			allowedDays: ['monday'],
			startTime: '08:00:00',
			endTime: '12:00:00',
			duration: 240,
		});
		const afternoon = makeAllocation({
			allowedDays: ['monday'],
			startTime: '12:00:00',
			endTime: '18:00:00',
			duration: 360,
		});
		const flexible = makeAllocation({
			allowedDays: ['monday', 'tuesday'],
			startTime: '08:00:00',
			endTime: '18:00:00',
			duration: 180,
		});
		const plan = buildTermPlan(1, [morning, afternoon, flexible], [venue]);
		const flexibleSlot = plan.find((slot) =>
			slot.allocationIds.includes(flexible.id)
		);
		expect(flexibleSlot?.dayOfWeek).toBe('tuesday');
	});

	it('does not exceed venue capacity by more than ten percent for any slot', () => {
		const baseCapacity = 100;
		const venue = makeVenue({ id: 30, capacity: baseCapacity });
		const moduleId = nextSemesterModuleId();
		const first = makeAllocation({
			semesterModule: { id: moduleId, module: { id: 900 } },
			semesterModuleId: moduleId,
			duration: 60,
			numberOfStudents: 55,
		});
		const second = makeAllocation({
			semesterModule: { id: moduleId, module: { id: 900 } },
			semesterModuleId: moduleId,
			duration: 60,
			numberOfStudents: 55,
		});
		const third = makeAllocation({
			semesterModule: { id: moduleId, module: { id: 900 } },
			semesterModuleId: moduleId,
			duration: 60,
			numberOfStudents: 10,
		});
		const plan = buildTermPlan(1, [first, second, third], [venue]);
		const maxCapacity = Math.floor(baseCapacity * 1.1);
		for (const slot of plan) {
			expect(slot.capacityUsed).toBeLessThanOrEqual(maxCapacity);
		}
	});

	it('never overlaps slots for the same venue and day', () => {
		const venue = makeVenue({ id: 31, capacity: 200 });
		const allocations = [
			makeAllocation({ duration: 90 }),
			makeAllocation({ duration: 120 }),
			makeAllocation({ duration: 60 }),
			makeAllocation({ duration: 150 }),
		];
		const plan = buildTermPlan(1, allocations, [venue]);
		const grouped: Record<string, { start: number; end: number }[]> = {};
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
			for (let i = 1; i < sorted.length; i += 1) {
				expect(sorted[i - 1].end).toBeLessThanOrEqual(sorted[i].start);
			}
		}
	});

	it('respects allowed days and time windows for every allocation', () => {
		const venue = makeVenue({ id: 32, capacity: 150 });
		const allocations: AllocationRecord[] = [];
		allocations.push(
			makeAllocation({
				allowedDays: ['monday', 'tuesday'],
				startTime: '08:00:00',
				endTime: '12:00:00',
				duration: 120,
			}),
			makeAllocation({
				allowedDays: ['wednesday'],
				startTime: '10:00:00',
				endTime: '16:00:00',
				duration: 180,
			}),
			makeAllocation({
				allowedDays: ['thursday', 'friday'],
				startTime: '09:00:00',
				endTime: '17:00:00',
				duration: 90,
			})
		);
		const plan = buildTermPlan(1, allocations, [venue]);
		const byId = new Map<number, AllocationRecord>();
		for (const allocation of allocations) {
			byId.set(allocation.id, allocation);
		}
		for (const slot of plan) {
			for (const allocationId of slot.allocationIds) {
				const allocation = byId.get(allocationId);
				if (!allocation) {
					continue;
				}
				expect(allocation.allowedDays).toContain(slot.dayOfWeek);
				const slotStart = timeToMinutes(slot.startTime);
				const slotEnd = timeToMinutes(slot.endTime);
				const windowStart = timeToMinutes(allocation.startTime);
				const windowEnd = timeToMinutes(allocation.endTime);
				expect(slotStart).toBeGreaterThanOrEqual(windowStart);
				expect(slotEnd).toBeLessThanOrEqual(windowEnd);
			}
		}
	});

	it('can schedule many allocations without violating constraints', () => {
		const venues = [
			makeVenue({ id: 40, capacity: 80 }),
			makeVenue({ id: 41, capacity: 100 }),
			makeVenue({ id: 42, capacity: 120 }),
		];
		const allocations: AllocationRecord[] = [];
		for (let i = 0; i < 30; i += 1) {
			allocations.push(
				makeAllocation({
					allowedDays: ['monday', 'tuesday'],
					startTime: '08:00:00',
					endTime: '18:00:00',
					duration: 60 + (i % 4) * 30,
					numberOfStudents: 30 + (i % 5) * 10,
				})
			);
		}
		const plan = buildTermPlan(1, allocations, venues);
		const allAllocationIds = new Set<number>();
		for (const slot of plan) {
			const venue = venues.find((v) => v.id === slot.venueId);
			expect(venue).toBeDefined();
			if (!venue) {
				continue;
			}
			const maxCapacity = Math.floor(venue.capacity * 1.1);
			expect(slot.capacityUsed).toBeLessThanOrEqual(maxCapacity);
			for (const allocationId of slot.allocationIds) {
				allAllocationIds.add(allocationId);
			}
		}
		for (const allocation of allocations) {
			expect(allAllocationIds.has(allocation.id)).toBe(true);
		}
	});

	it('throws when a required venue type is unavailable', () => {
		const restricted = makeAllocation({
			timetableAllocationVenueTypes: [{ venueTypeId: 999 }],
		});
		const attempt = () =>
			buildTermPlan(1, [restricted], [makeVenue({ typeId: 1 })]);
		expect(attempt).toThrow(
			'Unable to allocate slot with provided constraints'
		);
	});
});
