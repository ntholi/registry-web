import { eq } from 'drizzle-orm';
import { db, studentAuditLogs } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type StudentAuditLogInsert = typeof studentAuditLogs.$inferInsert;
export type StudentAuditLogQueryOptions = QueryOptions<typeof studentAuditLogs>;

export default class StudentAuditLogRepository extends BaseRepository<
	typeof studentAuditLogs,
	'id'
> {
	constructor() {
		super(studentAuditLogs, studentAuditLogs.id);
	}

	async findByStudentId(stdNo: number) {
		return db.query.studentAuditLogs.findMany({
			where: eq(studentAuditLogs.stdNo, stdNo),
			orderBy: (records, { desc }) => [desc(records.updatedAt)],
		});
	}

	async findUnsynced() {
		return db.query.studentAuditLogs.findMany({
			where: (records, { isNull }) => isNull(records.syncedAt),
			orderBy: (records, { asc }) => [asc(records.updatedAt)],
		});
	}

	async markAsSynced(id: number) {
		return db
			.update(studentAuditLogs)
			.set({ syncedAt: new Date() })
			.where(eq(studentAuditLogs.id, id))
			.returning();
	}
}

export const studentAuditLogRepository = new StudentAuditLogRepository();
