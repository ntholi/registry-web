import { and, eq, inArray } from 'drizzle-orm';
import { blockedStudents, db } from '@/core/database';
import BaseRepository, {
	type AuditOptions,
	type QueryOptions,
} from '@/core/platform/BaseRepository';

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

	async findBlockedByStdNos(stdNos: number[]) {
		if (stdNos.length === 0) return [];
		return db
			.select({ stdNo: blockedStudents.stdNo })
			.from(blockedStudents)
			.where(
				and(
					inArray(blockedStudents.stdNo, stdNos),
					eq(blockedStudents.status, 'blocked')
				)
			);
	}

	async bulkCreate(
		data: { stdNo: number; reason: string; byDepartment: string }[],
		audit?: AuditOptions
	) {
		if (data.length === 0) return [];
		const values = data.map((d) => ({
			stdNo: d.stdNo,
			reason: d.reason,
			byDepartment: d.byDepartment as 'registry',
			status: 'blocked' as const,
		}));

		if (!audit) {
			return db.insert(blockedStudents).values(values).returning();
		}

		return db.transaction(async (tx) => {
			const created = await tx
				.insert(blockedStudents)
				.values(values)
				.returning();

			await this.writeAuditLogBatch(
				tx,
				created.map((record) => ({
					operation: 'INSERT' as const,
					recordId: String(record.id),
					oldValues: null,
					newValues: record,
				})),
				audit
			);

			return created;
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
