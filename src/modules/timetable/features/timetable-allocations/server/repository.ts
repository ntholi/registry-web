import { eq } from 'drizzle-orm';
import {
	db,
	timetableAllocations,
	timetableAllocationVenueTypes,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type TimetableAllocationInsert =
	typeof timetableAllocations.$inferInsert;
export type TimetableAllocationQueryOptions = QueryOptions<
	typeof timetableAllocations
>;

export default class TimetableAllocationRepository extends BaseRepository<
	typeof timetableAllocations,
	'id'
> {
	constructor() {
		super(timetableAllocations, timetableAllocations.id);
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
			},
			orderBy: (timetableAllocations, { desc }) => [
				desc(timetableAllocations.createdAt),
			],
		});
	}

	async createWithVenueTypes(
		allocation: TimetableAllocationInsert,
		venueTypeIds: number[]
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

			return created;
		});
	}

	async updateVenueTypes(allocationId: number, venueTypeIds: number[]) {
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
		});
	}
}

export const timetableAllocationRepository =
	new TimetableAllocationRepository();
