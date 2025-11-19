import { eq } from 'drizzle-orm';
import { db, studentSemesterSyncRecords } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type StudentSemesterSyncRecordInsert =
	typeof studentSemesterSyncRecords.$inferInsert;
export type StudentSemesterSyncRecordQueryOptions = QueryOptions<
	typeof studentSemesterSyncRecords
>;

export default class StudentSemesterSyncRepository extends BaseRepository<
	typeof studentSemesterSyncRecords,
	'id'
> {
	constructor() {
		super(studentSemesterSyncRecords, studentSemesterSyncRecords.id);
	}

	async findByStudentSemesterId(studentSemesterId: number) {
		return db.query.studentSemesterSyncRecords.findMany({
			where: eq(
				studentSemesterSyncRecords.studentSemesterId,
				studentSemesterId
			),
			orderBy: (records, { desc }) => [desc(records.updatedAt)],
		});
	}

	async findUnsynced() {
		return db.query.studentSemesterSyncRecords.findMany({
			where: (records, { isNull }) => isNull(records.syncedAt),
			orderBy: (records, { asc }) => [asc(records.updatedAt)],
		});
	}

	async markAsSynced(id: number) {
		return db
			.update(studentSemesterSyncRecords)
			.set({ syncedAt: new Date() })
			.where(eq(studentSemesterSyncRecords.id, id))
			.returning();
	}
}

export const studentSemesterSyncRepository =
	new StudentSemesterSyncRepository();
