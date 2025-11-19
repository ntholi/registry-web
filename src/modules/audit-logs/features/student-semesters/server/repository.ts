import { eq } from 'drizzle-orm';
import {
	db,
	structureSemesters,
	studentSemesterAuditLogs,
	studentSemesters,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type StudentSemesterSyncRecordInsert =
	typeof studentSemesterAuditLogs.$inferInsert;
export type StudentSemesterSyncRecordQueryOptions = QueryOptions<
	typeof studentSemesterAuditLogs
>;
export type StudentSemesterUpdate = Partial<
	typeof studentSemesters.$inferInsert
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

	async getStructureSemestersByStructureId(structureId: number) {
		return db.query.structureSemesters.findMany({
			where: eq(structureSemesters.structureId, structureId),
			columns: { id: true, name: true, semesterNumber: true },
			orderBy: (sems, { asc }) => [asc(sems.semesterNumber)],
		});
	}

	async updateStudentSemesterWithAudit(
		studentSemesterId: number,
		updates: StudentSemesterUpdate,
		userId: string,
		reasons?: string
	) {
		return db.transaction(async (tx) => {
			const oldRecord = await tx.query.studentSemesters.findFirst({
				where: eq(studentSemesters.id, studentSemesterId),
			});

			if (!oldRecord) {
				throw new Error('Student semester not found');
			}

			const [updatedRecord] = await tx
				.update(studentSemesters)
				.set(updates)
				.where(eq(studentSemesters.id, studentSemesterId))
				.returning();

			await tx.insert(studentSemesterAuditLogs).values({
				studentSemesterId,
				oldValues: oldRecord as unknown as Record<string, unknown>,
				newValues: updatedRecord as unknown as Record<string, unknown>,
				reasons: reasons || null,
				updatedBy: userId,
			});

			return updatedRecord;
		});
	}
}

export const studentSemesterSyncRepository =
	new StudentSemesterSyncRepository();
