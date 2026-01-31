import { eq } from 'drizzle-orm';
import { db, recognizedSchools } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class RecognizedSchoolRepository extends BaseRepository<
	typeof recognizedSchools,
	'id'
> {
	constructor() {
		super(recognizedSchools, recognizedSchools.id);
	}

	async findAllActive() {
		return db.query.recognizedSchools.findMany({
			where: eq(recognizedSchools.isActive, true),
			orderBy: (schools, { asc }) => [asc(schools.name)],
		});
	}
}
