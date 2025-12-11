import { eq } from 'drizzle-orm';
import { db, studentAuditLogs, students } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type StudentAuditLogInsert = typeof studentAuditLogs.$inferInsert;
export type StudentAuditLogQueryOptions = QueryOptions<typeof studentAuditLogs>;
export type StudentUpdate = Partial<typeof students.$inferInsert>;

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

	async findByStudentIdWithUser(stdNo: number) {
		return db.query.studentAuditLogs.findMany({
			where: eq(studentAuditLogs.stdNo, stdNo),
			orderBy: (records, { desc }) => [desc(records.updatedAt)],
			with: {
				updatedByUser: {
					columns: { id: true, name: true, email: true, image: true },
				},
			},
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

	async updateStudentWithAudit(
		stdNo: number,
		updates: StudentUpdate,
		userId: string,
		reasons?: string
	) {
		return db.transaction(async (tx) => {
			const oldRecord = await tx.query.students.findFirst({
				where: eq(students.stdNo, stdNo),
			});

			if (!oldRecord) {
				throw new Error('Student not found');
			}

			// Convert dateOfBirth string to Date object if present
			const processedUpdates = {
				...updates,
				dateOfBirth: updates.dateOfBirth
					? new Date(updates.dateOfBirth)
					: updates.dateOfBirth,
			};

			const [updatedRecord] = await tx
				.update(students)
				.set(processedUpdates)
				.where(eq(students.stdNo, stdNo))
				.returning();

			await tx.insert(studentAuditLogs).values({
				stdNo,
				oldValues: oldRecord,
				newValues: updatedRecord,
				operation: 'update',
				reasons: reasons || null,
				updatedBy: userId,
			});

			return updatedRecord;
		});
	}
}

export const studentAuditLogRepository = new StudentAuditLogRepository();
