import { and, between, count, eq, gte, lte, or } from 'drizzle-orm';
import type {
	modules,
	programs,
	semesterModules,
	structureSemesters,
	structures,
	terms,
	timetableAllocations,
	users,
	venues,
	venueTypes,
} from '@/core/database';
import { db, timetableSlotAllocations, timetableSlots } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export type TimetableSlot = typeof timetableSlots.$inferSelect;
export type TimetableSlotInsert = typeof timetableSlots.$inferInsert;

export interface SlotWithAllocations extends TimetableSlot {
	allocations: {
		id: number;
		timetableAllocationId: number;
		allocation: typeof timetableAllocations.$inferSelect;
	}[];
	venue: typeof venues.$inferSelect & { type: typeof venueTypes.$inferSelect };
}

export type UserSlot = TimetableSlot & {
	timetableSlotAllocations: Array<{
		slotId: number;
		timetableAllocationId: number;
		createdAt: Date | null;
		timetableAllocation: typeof timetableAllocations.$inferSelect & {
			semesterModule: typeof semesterModules.$inferSelect & {
				module: typeof modules.$inferSelect;
				semester:
					| (typeof structureSemesters.$inferSelect & {
							structure: typeof structures.$inferSelect & {
								program: typeof programs.$inferSelect;
							};
					  })
					| null;
			};
			term: typeof terms.$inferSelect;
			user: typeof users.$inferSelect;
		};
	}>;
	venue:
		| (typeof venues.$inferSelect & {
				type: typeof venueTypes.$inferSelect;
		  })
		| null;
};

export interface PlannedSlotInput {
	termId: number;
	venueId: number;
	dayOfWeek: (typeof timetableSlots.dayOfWeek.enumValues)[number];
	startTime: string;
	endTime: string;
	capacityUsed: number;
	allocationIds: number[];
}

type TransactionExecutor = Parameters<typeof db.transaction>[0];
type TransactionClient = TransactionExecutor extends (
	tx: infer T
) => Promise<unknown>
	? T
	: never;
type DbExecutor = typeof db | TransactionClient;

export default class TimetableSlotRepository extends BaseRepository<
	typeof timetableSlots,
	'id'
> {
	constructor() {
		super(timetableSlots, timetableSlots.id);
	}

	async findSlotsForTerm(termId: number) {
		return db.query.timetableSlots.findMany({
			where: eq(timetableSlots.termId, termId),
			with: {
				timetableSlotAllocations: {
					with: {
						timetableAllocation: {
							with: {
								semesterModule: {
									with: {
										module: true,
									},
								},
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

	async findSlotsForVenueDay(
		termId: number,
		venueId: number,
		dayOfWeek: (typeof timetableSlots.dayOfWeek.enumValues)[number]
	) {
		return db.query.timetableSlots.findMany({
			where: and(
				eq(timetableSlots.termId, termId),
				eq(timetableSlots.venueId, venueId),
				eq(timetableSlots.dayOfWeek, dayOfWeek)
			),
			with: {
				timetableSlotAllocations: true,
			},
		});
	}

	async findSlotConflict(
		termId: number,
		venueId: number,
		dayOfWeek: (typeof timetableSlots.dayOfWeek.enumValues)[number],
		startTime: string,
		endTime: string
	) {
		return db.query.timetableSlots.findFirst({
			where: and(
				eq(timetableSlots.termId, termId),
				eq(timetableSlots.venueId, venueId),
				eq(timetableSlots.dayOfWeek, dayOfWeek),
				or(
					// existing overlaps new
					between(timetableSlots.startTime, startTime, endTime),
					between(timetableSlots.endTime, startTime, endTime),
					// new overlaps existing
					and(
						lte(timetableSlots.startTime, startTime),
						gte(timetableSlots.endTime, endTime)
					)
				)
			),
		});
	}

	async insertSlot(slot: TimetableSlotInsert, allocationId: number) {
		return db.transaction(async (tx) => {
			const [createdSlot] = await tx
				.insert(timetableSlots)
				.values(slot)
				.returning();

			await tx.insert(timetableSlotAllocations).values({
				slotId: createdSlot.id,
				timetableAllocationId: allocationId,
			});

			return createdSlot;
		});
	}

	async attachAllocation(slotId: number, allocationId: number) {
		await db.insert(timetableSlotAllocations).values({
			slotId,
			timetableAllocationId: allocationId,
		});
	}

	async detachAllocation(slotId: number, allocationId: number) {
		await db
			.delete(timetableSlotAllocations)
			.where(
				and(
					eq(timetableSlotAllocations.slotId, slotId),
					eq(timetableSlotAllocations.timetableAllocationId, allocationId)
				)
			);
	}

	async deleteEmptySlot(slotId: number) {
		const allocationCount = await db
			.select({ total: count() })
			.from(timetableSlotAllocations)
			.where(eq(timetableSlotAllocations.slotId, slotId));

		if (allocationCount[0]?.total === 0) {
			await db.delete(timetableSlots).where(eq(timetableSlots.id, slotId));
		}
	}

	async replaceTermSlots(
		termId: number,
		plan: PlannedSlotInput[],
		executor?: TransactionClient
	) {
		if (executor) {
			return this.persistPlan(executor, termId, plan);
		}
		return db.transaction(async (tx) => this.persistPlan(tx, termId, plan));
	}

	private async persistPlan(
		executor: DbExecutor,
		termId: number,
		plan: PlannedSlotInput[]
	) {
		await executor
			.delete(timetableSlots)
			.where(eq(timetableSlots.termId, termId));
		if (plan.length === 0) {
			return [] as { id: number }[];
		}
		const slotValues = plan.map((item) => ({
			termId,
			venueId: item.venueId,
			dayOfWeek: item.dayOfWeek,
			startTime: item.startTime,
			endTime: item.endTime,
			capacityUsed: item.capacityUsed,
		}));
		const inserted = await executor
			.insert(timetableSlots)
			.values(slotValues)
			.returning({
				id: timetableSlots.id,
				venueId: timetableSlots.venueId,
				dayOfWeek: timetableSlots.dayOfWeek,
				startTime: timetableSlots.startTime,
				endTime: timetableSlots.endTime,
			});
		const slotIdByKey = new Map<string, number>();
		for (const slot of inserted) {
			const key = this.buildSlotKey(
				slot.venueId,
				slot.dayOfWeek,
				slot.startTime,
				slot.endTime
			);
			slotIdByKey.set(key, slot.id);
		}
		const slotAllocationRows: {
			slotId: number;
			timetableAllocationId: number;
		}[] = [];
		for (const planItem of plan) {
			const slotKey = this.buildSlotKey(
				planItem.venueId,
				planItem.dayOfWeek,
				planItem.startTime,
				planItem.endTime
			);
			const slotId = slotIdByKey.get(slotKey);
			if (!slotId) {
				throw new Error('Unable to persist timetable slot plan');
			}
			for (const allocationId of planItem.allocationIds) {
				slotAllocationRows.push({
					slotId,
					timetableAllocationId: allocationId,
				});
			}
		}
		if (slotAllocationRows.length > 0) {
			await executor
				.insert(timetableSlotAllocations)
				.values(slotAllocationRows);
		}
		return inserted;
	}

	async findUserSlotsForTerm(
		userId: string,
		termId: number
	): Promise<UserSlot[]> {
		const slots = await db.query.timetableSlots.findMany({
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

		const filteredSlots = slots.filter((slot) =>
			slot.timetableSlotAllocations.some(
				(allocation) => allocation.timetableAllocation.userId === userId
			)
		);

		const semesterModuleIds = new Set<number>();
		for (const slot of filteredSlots) {
			for (const allocation of slot.timetableSlotAllocations) {
				semesterModuleIds.add(allocation.timetableAllocation.semesterModule.id);
			}
		}

		const semesterModules = await db.query.semesterModules.findMany({
			where: (tbl, { inArray }) =>
				inArray(tbl.id, Array.from(semesterModuleIds)),
			with: {
				module: true,
				semester: true,
			},
		});

		const semesterModuleMap = new Map(semesterModules.map((sm) => [sm.id, sm]));

		const structureIds = new Set<number>();
		for (const sm of semesterModules) {
			if (sm.semester?.structureId) {
				structureIds.add(sm.semester.structureId);
			}
		}

		const structures = await db.query.structures.findMany({
			where: (tbl, { inArray }) => inArray(tbl.id, Array.from(structureIds)),
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

		const structureMap = new Map(structures.map((s) => [s.id, s]));

		return filteredSlots.map((slot) => ({
			...slot,
			timetableSlotAllocations: slot.timetableSlotAllocations.map(
				(allocation) => {
					const semesterModule = semesterModuleMap.get(
						allocation.timetableAllocation.semesterModule.id
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

	private buildSlotKey(
		venueId: number,
		dayOfWeek: (typeof timetableSlots.dayOfWeek.enumValues)[number],
		startTime: string,
		endTime: string
	) {
		return `${venueId}-${dayOfWeek}-${startTime}-${endTime}`;
	}
}
