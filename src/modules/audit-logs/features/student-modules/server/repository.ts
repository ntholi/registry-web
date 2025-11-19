import { eq } from 'drizzle-orm';
import { db, studentModuleAuditLogs, studentModules } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type StudentModuleAuditLogInsert =
	typeof studentModuleAuditLogs.$inferInsert;
export type StudentModuleAuditLogQueryOptions = QueryOptions<
	typeof studentModuleAuditLogs
>;
export type StudentModuleUpdate = Partial<typeof studentModules.$inferInsert>;

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

	async getStudentModule(studentModuleId: number) {
		return db.query.studentModules.findFirst({
			where: eq(studentModules.id, studentModuleId),
		});
	}

	async updateStudentModuleWithAudit(
		studentModuleId: number,
		updates: StudentModuleUpdate,
		userId: string,
		reasons?: string
	) {
		return db.transaction(async (tx) => {
			const oldRecord = await tx.query.studentModules.findFirst({
				where: eq(studentModules.id, studentModuleId),
			});

			if (!oldRecord) {
				throw new Error('Student module not found');
			}

			const [updatedRecord] = await tx
				.update(studentModules)
				.set(updates)
				.where(eq(studentModules.id, studentModuleId))
				.returning();

			await tx.insert(studentModuleAuditLogs).values({
				studentModuleId,
				oldValues: oldRecord,
				newValues: updatedRecord,
				reasons: reasons || null,
				updatedBy: userId,
			});

			return updatedRecord;
		});
	}
}

export const studentModuleAuditLogRepository =
	new StudentModuleAuditLogRepository();
