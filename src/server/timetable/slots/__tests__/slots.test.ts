import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/core/database';
import { setMockUser } from '@/test/mocks.auth';
import { getUserTimetableSlots } from '../actions';

vi.mock('@/core/platform/withAuth', () => {
	return vi.importActual('@/test/mock.withAuth');
});

describe('getUserTimetableSlots', () => {
	beforeEach(() => {
		setMockUser({ role: 'admin' });
	});

	it('should return empty array when user has no slots', async () => {
		const userId = 'non-existent-user-xyz-123';

		const term = await db.query.terms.findFirst({
			orderBy: (terms, { desc }) => [desc(terms.id)],
		});

		if (!term) {
			console.warn('No terms found in database, skipping test');
			return;
		}

		const slots = await getUserTimetableSlots(userId, term.id);

		expect(slots).toBeDefined();
		expect(Array.isArray(slots)).toBe(true);
		expect(slots).toHaveLength(0);
	});

	it('should return slots for a specific user and term', async () => {
		const testUserId = 'test-lecturer-1';

		const term = await db.query.terms.findFirst({
			orderBy: (terms, { desc }) => [desc(terms.id)],
		});

		if (!term) {
			console.warn('No terms found in database, skipping test');
			return;
		}

		const allocation = await db.query.timetableAllocations.findFirst({
			where: (tbl, { eq }) => eq(tbl.userId, testUserId),
		});

		if (!allocation) {
			console.warn('No allocations found for test user, skipping test');
			return;
		}

		const slots = await getUserTimetableSlots(testUserId, allocation.termId);

		expect(slots).toBeDefined();
		expect(Array.isArray(slots)).toBe(true);

		if (slots.length > 0) {
			const slot = slots[0];
			expect(slot).toHaveProperty('id');
			expect(slot).toHaveProperty('termId');
			expect(slot).toHaveProperty('venueId');
			expect(slot).toHaveProperty('dayOfWeek');
			expect(slot).toHaveProperty('startTime');
			expect(slot).toHaveProperty('endTime');
			expect(slot).toHaveProperty('capacityUsed');
			expect(slot).toHaveProperty('timetableSlotAllocations');
			expect(slot).toHaveProperty('venue');

			expect(slot.termId).toBe(allocation.termId);

			const hasUserAllocation = slot.timetableSlotAllocations.some(
				(slotAlloc) => slotAlloc.timetableAllocation.userId === testUserId
			);
			expect(hasUserAllocation).toBe(true);
		}
	});

	it('should only return slots for the specified term', async () => {
		const testUserId = 'test-lecturer-2';

		const terms = await db.query.terms.findMany({
			orderBy: (terms, { desc }) => [desc(terms.id)],
			limit: 2,
		});

		if (terms.length < 1) {
			console.warn('Not enough terms in database, skipping test');
			return;
		}

		const termId = terms[0].id;
		const slots = await getUserTimetableSlots(testUserId, termId);

		expect(slots).toBeDefined();
		expect(Array.isArray(slots)).toBe(true);

		for (const slot of slots) {
			expect(slot.termId).toBe(termId);
		}
	});

	it('should include venue information with type', async () => {
		const testUserId = 'test-lecturer-3';

		const allocation = await db.query.timetableAllocations.findFirst({
			where: (tbl, { eq }) => eq(tbl.userId, testUserId),
		});

		if (!allocation) {
			console.warn('No allocations found for test user, skipping test');
			return;
		}

		const slots = await getUserTimetableSlots(testUserId, allocation.termId);

		if (slots.length > 0) {
			const slot = slots[0];
			expect(slot.venue).toBeDefined();
			expect(slot.venue).toHaveProperty('id');
			expect(slot.venue).toHaveProperty('name');
			expect(slot.venue).toHaveProperty('capacity');
			expect(slot.venue).toHaveProperty('type');
			expect(slot.venue.type).toBeDefined();
			expect(slot.venue.type).toHaveProperty('id');
			expect(slot.venue.type).toHaveProperty('name');
		}
	});

	it('should include allocation details with module and user info', async () => {
		const testUserId = 'test-lecturer-4';

		const allocation = await db.query.timetableAllocations.findFirst({
			where: (tbl, { eq }) => eq(tbl.userId, testUserId),
		});

		if (!allocation) {
			console.warn('No allocations found for test user, skipping test');
			return;
		}

		const slots = await getUserTimetableSlots(testUserId, allocation.termId);

		if (slots.length > 0) {
			const slot = slots[0];
			expect(slot.timetableSlotAllocations).toBeDefined();
			expect(slot.timetableSlotAllocations.length).toBeGreaterThan(0);

			const slotAllocation = slot.timetableSlotAllocations[0];
			expect(slotAllocation).toHaveProperty('timetableAllocation');
			expect(slotAllocation.timetableAllocation).toHaveProperty('id');
			expect(slotAllocation.timetableAllocation).toHaveProperty('userId');
			expect(slotAllocation.timetableAllocation).toHaveProperty(
				'semesterModule'
			);
			expect(slotAllocation.timetableAllocation).toHaveProperty('term');
			expect(slotAllocation.timetableAllocation).toHaveProperty('user');

			expect(slotAllocation.timetableAllocation.semesterModule).toHaveProperty(
				'module'
			);
			expect(slotAllocation.timetableAllocation.semesterModule).toHaveProperty(
				'semester'
			);
		}
	});

	it('should include program code and semester number', async () => {
		const testUserId = 'test-lecturer-7';

		const allocation = await db.query.timetableAllocations.findFirst({
			where: (tbl, { eq }) => eq(tbl.userId, testUserId),
		});

		if (!allocation) {
			console.warn('No allocations found for test user, skipping test');
			return;
		}

		const slots = await getUserTimetableSlots(testUserId, allocation.termId);

		if (slots.length > 0) {
			const slot = slots[0];
			const slotAllocation = slot.timetableSlotAllocations[0];

			expect(
				slotAllocation.timetableAllocation.semesterModule.semester
			).toBeDefined();

			if (slotAllocation.timetableAllocation.semesterModule.semester) {
				expect(
					slotAllocation.timetableAllocation.semesterModule.semester
				).toHaveProperty('semesterNumber');
				expect(
					slotAllocation.timetableAllocation.semesterModule.semester
				).toHaveProperty('structure');

				if (
					slotAllocation.timetableAllocation.semesterModule.semester.structure
				) {
					expect(
						slotAllocation.timetableAllocation.semesterModule.semester.structure
					).toHaveProperty('program');
					if (
						slotAllocation.timetableAllocation.semesterModule.semester.structure
							.program
					) {
						expect(
							slotAllocation.timetableAllocation.semesterModule.semester
								.structure.program
						).toHaveProperty('code');
					}
				}
			}
		}
	});

	it('should include lecturer name for display', async () => {
		const testUserId = 'test-lecturer-8';

		const allocation = await db.query.timetableAllocations.findFirst({
			where: (tbl, { eq }) => eq(tbl.userId, testUserId),
		});

		if (!allocation) {
			console.warn('No allocations found for test user, skipping test');
			return;
		}

		const slots = await getUserTimetableSlots(testUserId, allocation.termId);

		if (slots.length > 0) {
			const slot = slots[0];
			const slotAllocation = slot.timetableSlotAllocations[0];

			expect(slotAllocation.timetableAllocation.user).toBeDefined();
			expect(slotAllocation.timetableAllocation.user).toHaveProperty('name');
			expect(slotAllocation.timetableAllocation.user.name).toBeTruthy();
		}
	});

	it('should include venue name for display', async () => {
		const testUserId = 'test-lecturer-9';

		const allocation = await db.query.timetableAllocations.findFirst({
			where: (tbl, { eq }) => eq(tbl.userId, testUserId),
		});

		if (!allocation) {
			console.warn('No allocations found for test user, skipping test');
			return;
		}

		const slots = await getUserTimetableSlots(testUserId, allocation.termId);

		if (slots.length > 0) {
			const slot = slots[0];
			expect(slot.venue).toBeDefined();
			expect(slot.venue).toHaveProperty('name');
			expect(slot.venue.name).toBeTruthy();
		}
	});

	it('should not return slots for other users', async () => {
		const user1Id = 'test-user-1';
		const user2Id = 'test-user-2';

		const allocation1 = await db.query.timetableAllocations.findFirst({
			where: (tbl, { eq }) => eq(tbl.userId, user1Id),
		});

		if (!allocation1) {
			console.warn('No allocations found for test user, skipping test');
			return;
		}

		const slots = await getUserTimetableSlots(user2Id, allocation1.termId);

		for (const slot of slots) {
			const hasUser1Allocation = slot.timetableSlotAllocations.some(
				(slotAlloc) => slotAlloc.timetableAllocation.userId === user1Id
			);
			expect(hasUser1Allocation).toBe(false);
		}
	});

	it('should handle valid day of week values', async () => {
		const testUserId = 'test-lecturer-5';

		const allocation = await db.query.timetableAllocations.findFirst({
			where: (tbl, { eq }) => eq(tbl.userId, testUserId),
		});

		if (!allocation) {
			console.warn('No allocations found for test user, skipping test');
			return;
		}

		const slots = await getUserTimetableSlots(testUserId, allocation.termId);

		const validDays = [
			'monday',
			'tuesday',
			'wednesday',
			'thursday',
			'friday',
			'saturday',
			'sunday',
		];

		for (const slot of slots) {
			expect(validDays).toContain(slot.dayOfWeek);
		}
	});

	it('should return slots with valid time format', async () => {
		const testUserId = 'test-lecturer-6';

		const allocation = await db.query.timetableAllocations.findFirst({
			where: (tbl, { eq }) => eq(tbl.userId, testUserId),
		});

		if (!allocation) {
			console.warn('No allocations found for test user, skipping test');
			return;
		}

		const slots = await getUserTimetableSlots(testUserId, allocation.termId);

		const timeRegex = /^\d{2}:\d{2}:\d{2}$/;

		for (const slot of slots) {
			expect(slot.startTime).toMatch(timeRegex);
			expect(slot.endTime).toMatch(timeRegex);
			expect(slot.startTime < slot.endTime).toBe(true);
		}
	});

	it('should handle deeply nested relations without lateral join errors', async () => {
		const allocation = await db.query.timetableAllocations.findFirst({
			where: (tbl, { isNotNull }) => isNotNull(tbl.userId),
			with: {
				semesterModule: {
					with: {
						module: true,
						semester: {
							with: {
								structure: {
									with: {
										program: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!allocation) {
			console.warn('No allocations found, skipping test');
			return;
		}

		const slots = await getUserTimetableSlots(
			allocation.userId,
			allocation.termId
		);

		expect(slots).toBeDefined();
		expect(Array.isArray(slots)).toBe(true);

		if (slots.length > 0) {
			const slot = slots[0];
			const slotAllocation = slot.timetableSlotAllocations[0];

			expect(slotAllocation.timetableAllocation.semesterModule).toBeDefined();
			expect(
				slotAllocation.timetableAllocation.semesterModule.module
			).toBeDefined();
			expect(
				slotAllocation.timetableAllocation.semesterModule.semester
			).toBeDefined();

			if (slotAllocation.timetableAllocation.semesterModule.semester) {
				expect(
					slotAllocation.timetableAllocation.semesterModule.semester.structure
				).toBeDefined();

				if (
					slotAllocation.timetableAllocation.semesterModule.semester.structure
				) {
					expect(
						slotAllocation.timetableAllocation.semesterModule.semester.structure
							.program
					).toBeDefined();
				}
			}
		}
	});
});
