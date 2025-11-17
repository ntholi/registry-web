import { eq } from 'drizzle-orm';
import {
	db,
	lecturerAllocations,
	lecturerAllocationVenueTypes,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type LecturerAllocationInsert = typeof lecturerAllocations.$inferInsert;
export type LecturerAllocationQueryOptions = QueryOptions<
	typeof lecturerAllocations
>;

export default class LecturerAllocationRepository extends BaseRepository<
	typeof lecturerAllocations,
	'id'
> {
	constructor() {
		super(lecturerAllocations, lecturerAllocations.id);
	}

	async findByIdWithRelations(id: number) {
		return db.query.lecturerAllocations.findFirst({
			where: eq(lecturerAllocations.id, id),
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
				lecturerAllocationVenueTypes: {
					with: {
						venueType: true,
					},
				},
			},
		});
	}

	async findByUserIdWithRelations(userId: string) {
		return db.query.lecturerAllocations.findMany({
			where: eq(lecturerAllocations.userId, userId),
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
				lecturerAllocationVenueTypes: {
					with: {
						venueType: true,
					},
				},
			},
			orderBy: (lecturerAllocations, { desc }) => [
				desc(lecturerAllocations.createdAt),
			],
		});
	}

	async createWithVenueTypes(
		allocation: LecturerAllocationInsert,
		venueTypeIds: number[]
	) {
		return db.transaction(async (tx) => {
			const [created] = await tx
				.insert(lecturerAllocations)
				.values(allocation)
				.returning();

			if (venueTypeIds.length > 0) {
				await tx.insert(lecturerAllocationVenueTypes).values(
					venueTypeIds.map((venueTypeId) => ({
						lecturerAllocationId: created.id,
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
				.delete(lecturerAllocationVenueTypes)
				.where(
					eq(lecturerAllocationVenueTypes.lecturerAllocationId, allocationId)
				);

			if (venueTypeIds.length > 0) {
				await tx.insert(lecturerAllocationVenueTypes).values(
					venueTypeIds.map((venueTypeId) => ({
						lecturerAllocationId: allocationId,
						venueTypeId,
					}))
				);
			}
		});
	}
}

export const lecturerAllocationRepository = new LecturerAllocationRepository();
