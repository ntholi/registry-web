import { eq } from 'drizzle-orm';
import { db } from '@/core/database';
import { roomSchools, rooms } from '@/core/database/schema';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type RoomInsert = typeof rooms.$inferInsert;
export type RoomQueryOptions = QueryOptions<typeof rooms>;

export default class RoomRepository extends BaseRepository<typeof rooms, 'id'> {
	constructor() {
		super(rooms, rooms.id);
	}

	async findByIdWithRelations(id: number) {
		return db.query.rooms.findFirst({
			where: eq(rooms.id, id),
			with: {
				type: true,
				roomSchools: {
					with: {
						school: true,
					},
				},
			},
		});
	}

	async createWithSchools(
		room: RoomInsert,
		schoolIds: number[]
	): Promise<typeof rooms.$inferSelect> {
		return db.transaction(async (tx) => {
			const [newRoom] = await tx.insert(rooms).values(room).returning();

			if (schoolIds.length > 0) {
				await tx.insert(roomSchools).values(
					schoolIds.map((schoolId) => ({
						roomId: newRoom.id,
						schoolId,
					}))
				);
			}

			return newRoom;
		});
	}

	async updateWithSchools(
		id: number,
		room: Partial<RoomInsert>,
		schoolIds?: number[]
	): Promise<typeof rooms.$inferSelect | undefined> {
		return db.transaction(async (tx) => {
			const [updated] = await tx
				.update(rooms)
				.set(room)
				.where(eq(rooms.id, id))
				.returning();

			if (schoolIds !== undefined) {
				await tx.delete(roomSchools).where(eq(roomSchools.roomId, id));

				if (schoolIds.length > 0) {
					await tx.insert(roomSchools).values(
						schoolIds.map((schoolId) => ({
							roomId: id,
							schoolId,
						}))
					);
				}
			}

			return updated;
		});
	}
}

export const roomRepository = new RoomRepository();
