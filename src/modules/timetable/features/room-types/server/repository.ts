import { roomTypes } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type RoomTypeInsert = typeof roomTypes.$inferInsert;
export type RoomTypeQueryOptions = QueryOptions<typeof roomTypes>;

export default class RoomTypeRepository extends BaseRepository<
	typeof roomTypes,
	'id'
> {
	constructor() {
		super(roomTypes, roomTypes.id);
	}
}

export const roomTypeRepository = new RoomTypeRepository();
