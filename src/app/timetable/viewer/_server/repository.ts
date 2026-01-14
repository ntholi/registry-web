import type { UserSlot } from '@timetable/slots';
import { and, eq, inArray } from 'drizzle-orm';
import {
	db,
	semesterModules,
	structures,
	timetableAllocations,
	timetableSlots,
} from '@/core/database';

async function enrichSlotsWithRelations(
	slots: Awaited<ReturnType<typeof findBaseSlotsForTerm>>
): Promise<UserSlot[]> {
	if (slots.length === 0) return [];

	const semesterModuleIds = new Set<number>();
	for (const slot of slots) {
		for (const allocation of slot.timetableSlotAllocations) {
			semesterModuleIds.add(allocation.timetableAllocation.semesterModuleId);
		}
	}

	const semesterModulesData = await db.query.semesterModules.findMany({
		where: inArray(semesterModules.id, Array.from(semesterModuleIds)),
		with: {
			module: true,
			semester: true,
		},
	});

	const semesterModuleMap = new Map(
		semesterModulesData.map((sm) => [sm.id, sm])
	);

	const structureIds = new Set<number>();
	for (const sm of semesterModulesData) {
		if (sm.semester?.structureId) {
			structureIds.add(sm.semester.structureId);
		}
	}

	const structuresData = await db.query.structures.findMany({
		where: inArray(structures.id, Array.from(structureIds)),
		with: {
			program: {
				columns: {
					id: true,
					code: true,
					name: true,
					level: true,
				},
			},
		},
	});

	const structureMap = new Map(structuresData.map((s) => [s.id, s]));

	return slots.map((slot) => ({
		...slot,
		timetableSlotAllocations: slot.timetableSlotAllocations.map(
			(allocation) => {
				const semesterModule = semesterModuleMap.get(
					allocation.timetableAllocation.semesterModuleId
				);
				return {
					...allocation,
					timetableAllocation: {
						...allocation.timetableAllocation,
						semesterModule: semesterModule
							? {
									...semesterModule,
									semester: semesterModule.semester
										? {
												...semesterModule.semester,
												structure: structureMap.get(
													semesterModule.semester.structureId
												),
											}
										: null,
								}
							: allocation.timetableAllocation.semesterModule,
					},
				};
			}
		),
	})) as UserSlot[];
}

async function findBaseSlotsForTerm(termId: number) {
	return db.query.timetableSlots.findMany({
		where: eq(timetableSlots.termId, termId),
		with: {
			timetableSlotAllocations: {
				with: {
					timetableAllocation: {
						with: {
							semesterModule: true,
							term: true,
							user: true,
						},
					},
				},
			},
			venue: {
				with: {
					type: true,
				},
			},
		},
	});
}

export async function findSlotsForVenue(
	venueId: string,
	termId: number
): Promise<UserSlot[]> {
	const slots = await findBaseSlotsForTerm(termId);
	const filteredSlots = slots.filter((slot) => slot.venueId === venueId);
	return enrichSlotsWithRelations(filteredSlots);
}

export async function findSlotsForClass(
	semesterId: number,
	termId: number
): Promise<UserSlot[]> {
	const semesterModulesForClass = await db.query.semesterModules.findMany({
		where: eq(semesterModules.semesterId, semesterId),
		columns: { id: true },
	});

	const semesterModuleIds = semesterModulesForClass.map((sm) => sm.id);
	if (semesterModuleIds.length === 0) return [];

	const allocationIds = await db
		.select({ id: timetableAllocations.id })
		.from(timetableAllocations)
		.where(
			and(
				inArray(timetableAllocations.semesterModuleId, semesterModuleIds),
				eq(timetableAllocations.termId, termId)
			)
		);

	const allocationIdSet = new Set(allocationIds.map((a) => a.id));
	if (allocationIdSet.size === 0) return [];

	const slots = await findBaseSlotsForTerm(termId);
	const filteredSlots = slots.filter((slot) =>
		slot.timetableSlotAllocations.some((sa) =>
			allocationIdSet.has(sa.timetableAllocationId)
		)
	);

	return enrichSlotsWithRelations(filteredSlots);
}

export async function findSlotsForUser(
	userId: string,
	termId: number
): Promise<UserSlot[]> {
	const slots = await findBaseSlotsForTerm(termId);
	const filteredSlots = slots.filter((slot) =>
		slot.timetableSlotAllocations.some(
			(allocation) => allocation.timetableAllocation.userId === userId
		)
	);
	return enrichSlotsWithRelations(filteredSlots);
}

export async function getClassesForTerm(termId: number) {
	const allocations = await db.query.timetableAllocations.findMany({
		where: eq(timetableAllocations.termId, termId),
		columns: {
			semesterModuleId: true,
		},
		with: {
			semesterModule: {
				columns: {
					semesterId: true,
				},
				with: {
					semester: {
						columns: {
							id: true,
							semesterNumber: true,
							structureId: true,
						},
						with: {
							structure: {
								columns: {
									id: true,
								},
								with: {
									program: {
										columns: {
											id: true,
											code: true,
											name: true,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	});

	const classMap = new Map<
		number,
		{
			semesterId: number;
			semesterNumber: string;
			programCode: string;
			programName: string;
		}
	>();

	for (const allocation of allocations) {
		const semester = allocation.semesterModule.semester;
		if (semester && !classMap.has(semester.id)) {
			classMap.set(semester.id, {
				semesterId: semester.id,
				semesterNumber: semester.semesterNumber,
				programCode: semester.structure.program.code,
				programName: semester.structure.program.name,
			});
		}
	}

	return Array.from(classMap.values()).sort((a, b) => {
		const codeCompare = a.programCode.localeCompare(b.programCode);
		if (codeCompare !== 0) return codeCompare;
		return a.semesterNumber.localeCompare(b.semesterNumber);
	});
}
