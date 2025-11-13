import { and, eq } from 'drizzle-orm';
import { db } from '@/core/db';
import { blockedStudents } from '@/core/db/schema';
import BaseRepository, {
	type QueryOptions,
} from '@/server/base/BaseRepository';

export default class BlockedStudentRepository extends BaseRepository<
	typeof blockedStudents,
	'id'
> {
	constructor() {
		super(blockedStudents, blockedStudents.id);
	}

	async findById(id: number) {
		return db.query.blockedStudents.findFirst({
			where: eq(blockedStudents.id, id),
			with: {
				student: true,
			},
		});
	}

	async findByStdNo(
		stdNo: number,
		status: 'blocked' | 'unblocked' = 'blocked'
	) {
		return db.query.blockedStudents.findFirst({
			where: and(
				eq(blockedStudents.stdNo, stdNo),
				eq(blockedStudents.status, status)
			),
		});
	}

	async query(options: QueryOptions<typeof blockedStudents>) {
		const criteria = this.buildQueryCriteria(options);

		const data = await db.query.blockedStudents.findMany({
			...criteria,
			with: {
				student: true,
			},
		});

		return this.createPaginatedResult(data, criteria);
	}
}

export const blockedStudentsRepository = new BlockedStudentRepository();
