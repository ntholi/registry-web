import { eq } from 'drizzle-orm';
import { db, venueSchools, venues } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type VenueInsert = typeof venues.$inferInsert;
export type VenueQueryOptions = QueryOptions<typeof venues>;

export default class VenueRepository extends BaseRepository<
	typeof venues,
	'id'
> {
	constructor() {
		super(venues, venues.id);
	}

	async findByIdWithRelations(id: number) {
		return db.query.venues.findFirst({
			where: eq(venues.id, id),
			with: {
				type: true,
				venueSchools: {
					with: {
						school: true,
					},
				},
			},
		});
	}

	async findAllWithRelations(options: VenueQueryOptions) {
		const citeria = this.buildQueryCriteria(options);

		const items = await db.query.venues.findMany({
			...citeria,
			with: {
				type: true,
			},
		});

		return this.createPaginatedResult(items, citeria);
	}

	async createWithSchools(
		venue: VenueInsert,
		schoolIds: number[]
	): Promise<typeof venues.$inferSelect> {
		return db.transaction(async (tx) => {
			const [newVenue] = await tx.insert(venues).values(venue).returning();

			if (schoolIds.length > 0) {
				await tx.insert(venueSchools).values(
					schoolIds.map((schoolId) => ({
						venueId: newVenue.id,
						schoolId,
					}))
				);
			}

			return newVenue;
		});
	}

	async updateWithSchools(
		id: number,
		venue: Partial<VenueInsert>,
		schoolIds?: number[]
	): Promise<typeof venues.$inferSelect | undefined> {
		return db.transaction(async (tx) => {
			const [updated] = await tx
				.update(venues)
				.set(venue)
				.where(eq(venues.id, id))
				.returning();

			if (schoolIds !== undefined) {
				await tx.delete(venueSchools).where(eq(venueSchools.venueId, id));

				if (schoolIds.length > 0) {
					await tx.insert(venueSchools).values(
						schoolIds.map((schoolId) => ({
							venueId: id,
							schoolId,
						}))
					);
				}
			}

			return updated;
		});
	}
}

export const venueRepository = new VenueRepository();
