import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { programs, schools } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';

export default class SchoolRepository extends BaseRepository<typeof schools, 'id'> {
	constructor() {
		super(schools, schools.id);
	}

	async getProgramsBySchoolId(schoolId: number) {
		return db.query.programs.findMany({
			columns: {
				id: true,
				name: true,
				code: true,
			},
			where: eq(programs.schoolId, schoolId),
			orderBy: desc(programs.id),
		});
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
