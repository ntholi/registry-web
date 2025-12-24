import { desc, eq } from 'drizzle-orm';
import { db, programs, schools } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class SchoolRepository extends BaseRepository<
	typeof schools,
	'id'
> {
	constructor() {
		super(schools, schools.id);
	}

	async getActiveSchools() {
		return db
			.select({
				id: schools.id,
				code: schools.code,
				name: schools.name,
			})
			.from(schools)
			.where(eq(schools.isActive, true))
			.orderBy(schools.code);
	}

	async getProgramsBySchoolId(schoolId?: number) {
		const baseQuery = db
			.select({
				id: programs.id,
				code: programs.code,
				name: programs.name,
				schoolId: programs.schoolId,
			})
			.from(programs);

		if (schoolId) {
			return await baseQuery
				.where(eq(programs.schoolId, schoolId))
				.orderBy(desc(programs.id));
		}

		return await baseQuery.orderBy(desc(programs.id));
	}

	async getAllPrograms() {
		return db.query.programs.findMany({
			columns: {
				id: true,
				name: true,
				code: true,
			},
			orderBy: desc(programs.id),
		});
	}
}

export const schoolsRepository = new SchoolRepository();
