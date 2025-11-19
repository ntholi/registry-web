import { eq } from 'drizzle-orm';
import { db, studentModuleAuditLogs } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type StudentModuleAuditLogInsert =
	typeof studentModuleAuditLogs.$inferInsert;
export type StudentModuleAuditLogQueryOptions = QueryOptions<
	typeof studentModuleAuditLogs
>;

export default class StudentModuleAuditLogRepository extends BaseRepository<
	typeof studentModuleAuditLogs,
	'id'
> {
	constructor() {
		super(studentModuleAuditLogs, studentModuleAuditLogs.id);
	}

	async findByStudentModuleId(studentModuleId: number) {
		return db.query.studentModuleAuditLogs.findMany({
			where: eq(studentModuleAuditLogs.studentModuleId, studentModuleId),
			orderBy: (records, { desc }) => [desc(records.updatedAt)],
		});
	}

	async findUnsynced() {
		return db.query.studentModuleAuditLogs.findMany({
			where: (records, { isNull }) => isNull(records.syncedAt),
			orderBy: (records, { asc }) => [asc(records.updatedAt)],
		});
	}

	async markAsSynced(id: number) {
		return db
			.update(studentModuleAuditLogs)
			.set({ syncedAt: new Date() })
			.where(eq(studentModuleAuditLogs.id, id))
			.returning();
	}
}

export const studentModuleAuditLogRepository =
	new StudentModuleAuditLogRepository();
