import { db, venueTypes } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type VenueTypeInsert = typeof venueTypes.$inferInsert;
export type VenueTypeQueryOptions = QueryOptions<typeof venueTypes>;

export default class VenueTypeRepository extends BaseRepository<
	typeof venueTypes,
	'id'
> {
	constructor() {
		super(venueTypes, venueTypes.id);
	}

	async findAll() {
		return db.query.venueTypes.findMany({
			orderBy: (venueTypes, { asc }) => [asc(venueTypes.name)],
		});
	}
}

export const venueTypeRepository = new VenueTypeRepository();
