import { eq } from 'drizzle-orm';
import { db, studentSemesterAuditLogs } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type StudentSemesterSyncRecordInsert =
	typeof studentSemesterAuditLogs.$inferInsert;
export type StudentSemesterSyncRecordQueryOptions = QueryOptions<
	typeof studentSemesterAuditLogs
>;

export default class StudentSemesterSyncRepository extends BaseRepository<
	typeof studentSemesterAuditLogs,
	'id'
> {
	constructor() {
		super(studentSemesterAuditLogs, studentSemesterAuditLogs.id);
	}

	async findByStudentSemesterId(studentSemesterId: number) {
		return db.query.studentSemesterAuditLogs.findMany({
			where: eq(studentSemesterAuditLogs.studentSemesterId, studentSemesterId),
			orderBy: (records, { desc }) => [desc(records.updatedAt)],
		});
	}

	async findUnsynced() {
		return db.query.studentSemesterAuditLogs.findMany({
			where: (records, { isNull }) => isNull(records.syncedAt),
			orderBy: (records, { asc }) => [asc(records.updatedAt)],
		});
	}

	async markAsSynced(id: number) {
		return db
			.update(studentSemesterAuditLogs)
			.set({ syncedAt: new Date() })
			.where(eq(studentSemesterAuditLogs.id, id))
			.returning();
	}
}

export const studentSemesterSyncRepository =
	new StudentSemesterSyncRepository();
