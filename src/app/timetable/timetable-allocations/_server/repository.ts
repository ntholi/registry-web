import { eq, inArray } from 'drizzle-orm';
import {
	db,
	timetableAllocationAllowedVenues,
	timetableAllocations,
	timetableAllocationVenueTypes,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';
import {
	type AllocationRecord,
	buildTermPlan,
	type VenueRecord,
} from '../../slots/_server/planner';
import TimetableSlotRepository from '../../slots/_server/repository';

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type TimetableAllocationInsert =
	typeof timetableAllocations.$inferInsert;
export type TimetableAllocationQueryOptions = QueryOptions<
	typeof timetableAllocations
>;

export default class TimetableAllocationRepository extends BaseRepository<
	typeof timetableAllocations,
	'id'
> {
	private readonly slotRepository: TimetableSlotRepository;

	constructor() {
		super(timetableAllocations, timetableAllocations.id);
		this.slotRepository = new TimetableSlotRepository();
	}

	async findByIdWithRelations(id: number) {
		return db.query.timetableAllocations.findFirst({
			where: eq(timetableAllocations.id, id),
			with: {
				user: true,
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
				term: true,
				timetableAllocationVenueTypes: {
					with: {
						venueType: true,
					},
				},
				timetableAllocationAllowedVenues: {
					with: {
						venue: true,
					},
				},
			},
		});
	}

	async findByUserIdWithRelations(userId: string) {
		return db.query.timetableAllocations.findMany({
			where: eq(timetableAllocations.userId, userId),
			with: {
				user: true,
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
				term: true,
				timetableAllocationVenueTypes: {
					with: {
						venueType: true,
					},
				},
				timetableAllocationAllowedVenues: {
					with: {
						venue: true,
					},
				},
				timetableSlotAllocations: {
					with: {
						slot: {
							with: {
								venue: true,
							},
						},
					},
				},
			},
			orderBy: (timetableAllocations, { desc }) => [
				desc(timetableAllocations.createdAt),
			],
		});
	}

	async findDuplicate(
		semesterModuleId: number,
		termId: number,
		classType:
			| 'lecture'
			| 'tutorial'
			| 'lab'
			| 'workshop'
			| 'practical'
			| undefined,
		groupName: string | null | undefined
	) {
		const resolvedClassType = classType ?? 'lecture';
		return db.query.timetableAllocations.findFirst({
			where: (table, { eq, and, isNull }) => {
				const conditions = [
					eq(table.semesterModuleId, semesterModuleId),
					eq(table.termId, termId),
					eq(table.classType, resolvedClassType),
				];
				if (groupName === null || groupName === undefined) {
					conditions.push(isNull(table.groupName));
				} else {
					conditions.push(eq(table.groupName, groupName));
				}
				return and(...conditions);
			},
		});
	}

	async createAllocation(allocation: TimetableAllocationInsert) {
		return db.transaction(async (tx) => {
			const [created] = await tx
				.insert(timetableAllocations)
				.values(allocation)
				.returning();
			await this.rebuildTermSlots(tx, created.termId);
			return created;
		});
	}

	async createWithVenueTypes(
		allocation: TimetableAllocationInsert,
		venueTypeIds: string[],
		allowedVenueIds: string[]
	) {
		return db.transaction(async (tx) => {
			const [created] = await tx
				.insert(timetableAllocations)
				.values(allocation)
				.returning();

			if (venueTypeIds.length > 0) {
				await tx.insert(timetableAllocationVenueTypes).values(
					venueTypeIds.map((venueTypeId) => ({
						timetableAllocationId: created.id,
						venueTypeId,
					}))
				);
			}

			if (allowedVenueIds.length > 0) {
				await tx.insert(timetableAllocationAllowedVenues).values(
					allowedVenueIds.map((venueId) => ({
						timetableAllocationId: created.id,
						venueId,
					}))
				);
			}

			await this.rebuildTermSlots(tx, created.termId);
			return created;
		});
	}

	async createManyWithVenueTypes(
		allocations: TimetableAllocationInsert[],
		venueTypeIds: string[],
		allowedVenueIds: string[]
	) {
		if (allocations.length === 0) {
			return [] as (typeof timetableAllocations.$inferSelect)[];
		}
		return db.transaction(async (tx) => {
			const created: (typeof timetableAllocations.$inferSelect)[] = [];
			const affectedTerms = new Set<number>();
			for (const allocation of allocations) {
				const [entry] = await tx
					.insert(timetableAllocations)
					.values(allocation)
					.returning();
				created.push(entry);
				affectedTerms.add(entry.termId);
				if (venueTypeIds.length > 0) {
					await tx.insert(timetableAllocationVenueTypes).values(
						venueTypeIds.map((venueTypeId) => ({
							timetableAllocationId: entry.id,
							venueTypeId,
						}))
					);
				}
				if (allowedVenueIds.length > 0) {
					await tx.insert(timetableAllocationAllowedVenues).values(
						allowedVenueIds.map((venueId) => ({
							timetableAllocationId: entry.id,
							venueId,
						}))
					);
				}
			}
			for (const termId of affectedTerms) {
				await this.rebuildTermSlots(tx, termId);
			}
			return created;
		});
	}

	async updateAllocation(
		id: number,
		allocation: Partial<TimetableAllocationInsert>
	) {
		return db.transaction(async (tx) => {
			const [updated] = await tx
				.update(timetableAllocations)
				.set(allocation)
				.where(eq(timetableAllocations.id, id))
				.returning();
			if (!updated) {
				throw new Error('Timetable allocation not found');
			}
			await this.rebuildTermSlots(tx, updated.termId);
			return updated;
		});
	}

	async deleteAllocation(id: number) {
		return db.transaction(async (tx) => {
			const existing = await tx.query.timetableAllocations.findFirst({
				where: eq(timetableAllocations.id, id),
			});
			if (!existing) {
				return;
			}
			await tx
				.delete(timetableAllocations)
				.where(eq(timetableAllocations.id, id));
			await this.rebuildTermSlots(tx, existing.termId, true);
		});
	}

	async deleteAllocations(ids: number[]) {
		if (ids.length === 0) return;
		return db.transaction(async (tx) => {
			const existing = await tx.query.timetableAllocations.findMany({
				where: inArray(timetableAllocations.id, ids),
			});
			if (existing.length === 0) return;

			const affectedTerms = new Set(existing.map((a) => a.termId));
			await tx
				.delete(timetableAllocations)
				.where(inArray(timetableAllocations.id, ids));
			for (const termId of affectedTerms) {
				await this.rebuildTermSlots(tx, termId, true);
			}
		});
	}

	async updateVenueTypes(allocationId: number, venueTypeIds: string[]) {
		return db.transaction(async (tx) => {
			await tx
				.delete(timetableAllocationVenueTypes)
				.where(
					eq(timetableAllocationVenueTypes.timetableAllocationId, allocationId)
				);

			if (venueTypeIds.length > 0) {
				await tx.insert(timetableAllocationVenueTypes).values(
					venueTypeIds.map((venueTypeId) => ({
						timetableAllocationId: allocationId,
						venueTypeId,
					}))
				);
			}
			const allocation = await tx.query.timetableAllocations.findFirst({
				where: eq(timetableAllocations.id, allocationId),
			});
			if (!allocation) {
				throw new Error('Timetable allocation not found');
			}
			await this.rebuildTermSlots(tx, allocation.termId);
		});
	}

	async updateAllowedVenues(allocationId: number, venueIds: string[]) {
		return db.transaction(async (tx) => {
			await tx
				.delete(timetableAllocationAllowedVenues)
				.where(
					eq(
						timetableAllocationAllowedVenues.timetableAllocationId,
						allocationId
					)
				);

			if (venueIds.length > 0) {
				await tx.insert(timetableAllocationAllowedVenues).values(
					venueIds.map((venueId) => ({
						timetableAllocationId: allocationId,
						venueId,
					}))
				);
			}
			const allocation = await tx.query.timetableAllocations.findFirst({
				where: eq(timetableAllocations.id, allocationId),
			});
			if (!allocation) {
				throw new Error('Timetable allocation not found');
			}
			await this.rebuildTermSlots(tx, allocation.termId);
		});
	}

	private async rebuildTermSlots(
		tx: TransactionClient,
		termId: number,
		skipOnFailure = false
	) {
		const allocations = (await tx.query.timetableAllocations.findMany({
			where: eq(timetableAllocations.termId, termId),
			with: {
				timetableAllocationVenueTypes: true,
				timetableAllocationAllowedVenues: true,
				semesterModule: {
					with: {
						module: true,
					},
				},
				user: {
					with: {
						userSchools: true,
					},
				},
			},
		})) as AllocationRecord[];
		if (allocations.length === 0) {
			await this.slotRepository.replaceTermSlots(termId, [], tx);
			return;
		}
		const venues = (await tx.query.venues.findMany({
			with: {
				type: true,
				venueSchools: true,
			},
		})) as VenueRecord[];
		if (venues.length === 0) {
			throw new Error('No venues available for timetable planning');
		}
		const plan = buildTermPlan(termId, allocations, venues, { skipOnFailure });
		await this.slotRepository.replaceTermSlots(termId, plan, tx);
	}
}

export const timetableAllocationRepository =
	new TimetableAllocationRepository();
