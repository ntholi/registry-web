import { eq } from 'drizzle-orm';
import { db, studentProgramAuditLogs, studentPrograms } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type StudentProgramAuditRecordInsert =
	typeof studentProgramAuditLogs.$inferInsert;
export type StudentProgramAuditRecordQueryOptions = QueryOptions<
	typeof studentProgramAuditLogs
>;
export type StudentProgramUpdate = Partial<typeof studentPrograms.$inferInsert>;

export default class StudentProgramAuditRepository extends BaseRepository<
	typeof studentProgramAuditLogs,
	'id'
> {
	constructor() {
		super(studentProgramAuditLogs, studentProgramAuditLogs.id);
	}

	async findByStudentProgramId(studentProgramId: number) {
		return db.query.studentProgramAuditLogs.findMany({
			where: eq(studentProgramAuditLogs.studentProgramId, studentProgramId),
			orderBy: (records, { desc }) => [desc(records.updatedAt)],
		});
	}

	async findByStudentProgramIdWithUser(studentProgramId: number) {
		return db.query.studentProgramAuditLogs.findMany({
			where: eq(studentProgramAuditLogs.studentProgramId, studentProgramId),
			orderBy: (records, { desc }) => [desc(records.updatedAt)],
			with: {
				updatedByUser: {
					columns: { id: true, name: true, email: true, image: true },
				},
			},
		});
	}

	async findUnsynced() {
		return db.query.studentProgramAuditLogs.findMany({
			where: (records, { isNull }) => isNull(records.syncedAt),
			orderBy: (records, { asc }) => [asc(records.updatedAt)],
		});
	}

	async markAsSynced(id: number) {
		return db
			.update(studentProgramAuditLogs)
			.set({ syncedAt: new Date() })
			.where(eq(studentProgramAuditLogs.id, id))
			.returning();
	}

	async updateStudentProgramWithAudit(
		studentProgramId: number,
		updates: StudentProgramUpdate,
		userId: string,
		reasons?: string
	) {
		return db.transaction(async (tx) => {
			const oldRecord = await tx.query.studentPrograms.findFirst({
				where: eq(studentPrograms.id, studentProgramId),
			});

			if (!oldRecord) {
				throw new Error('Student program not found');
			}

			const [updatedRecord] = await tx
				.update(studentPrograms)
				.set(updates)
				.where(eq(studentPrograms.id, studentProgramId))
				.returning();

			await tx.insert(studentProgramAuditLogs).values({
				studentProgramId,
				studentProgramCmsId: oldRecord.cmsId,
				oldValues: oldRecord,
				newValues: updatedRecord,
				reasons: reasons || null,
				updatedBy: userId,
			});

			return updatedRecord;
		});
	}
}

export const studentProgramAuditRepository =
	new StudentProgramAuditRepository();
