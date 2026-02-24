import type { blockedStudents, DashboardUser } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import BlockedStudentRepository from './repository';

type BlockedStudent = typeof blockedStudents.$inferInsert;

class BlockedStudentService {
	constructor(private readonly repository = new BlockedStudentRepository()) {}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), ['finance']);
	}

	async getByStdNo(stdNo: number, status: 'blocked' | 'unblocked' = 'blocked') {
		return withAuth(
			async () => this.repository.findByStdNo(stdNo, status),
			['all']
		);
	}

	async getAll(params: QueryOptions<typeof blockedStudents>) {
		return withAuth(
			async () => this.repository.query(params),
			['finance', 'registry']
		);
	}

	async create(data: BlockedStudent) {
		return withAuth(
			async (session) => {
				return this.repository.create(
					{
						...data,
						byDepartment: session?.user?.role as DashboardUser,
						status: 'blocked',
					},
					{ userId: session!.user!.id!, activityType: 'student_blocked' }
				);
			},
			['finance', 'registry', 'library']
		);
	}

	async update(id: number, data: Partial<BlockedStudent>) {
		const existing = await this.repository.findById(id);
		if (!existing) {
			throw new Error('Blocked student record not found');
		}

		const blockedBy = existing.byDepartment;

		return withAuth(
			async (session) => {
				const activityType =
					data.status === 'unblocked' ? 'student_unblocked' : 'student_blocked';
				return this.repository.update(
					id,
					{
						...data,
						byDepartment: session?.user?.role as DashboardUser,
					},
					{ userId: session!.user!.id!, activityType }
				);
			},
			async (session) => {
				if (session.user?.role === 'admin') return true;
				if (data.status === 'unblocked') {
					return session.user?.role === blockedBy;
				}
				return ['finance', 'registry', 'library'].includes(
					session.user?.role ?? ''
				);
			}
		);
	}

	async delete(id: number) {
		return withAuth(
			async (session) =>
				this.repository.delete(id, {
					userId: session!.user!.id!,
					activityType: 'student_unblocked',
				}),
			['admin', 'finance', 'registry', 'library']
		);
	}

	async bulkCreate(
		data: { stdNo: number; reason: string }[],
		department?: string
	) {
		return withAuth(
			async (session) => {
				const stdNos = data.map((d) => d.stdNo);
				const alreadyBlocked =
					await this.repository.findBlockedByStdNos(stdNos);
				const blockedSet = new Set(alreadyBlocked.map((b) => b.stdNo));

				const deptToUse = department || session?.user?.role || 'registry';

				const toCreate = data
					.filter((d) => !blockedSet.has(d.stdNo))
					.map((d) => ({
						stdNo: d.stdNo,
						reason: d.reason,
						byDepartment: deptToUse,
					}));

				await this.repository.bulkCreate(toCreate, {
					userId: session!.user!.id!,
					activityType: 'student_blocked',
				});

				return {
					imported: toCreate.length,
					skipped: blockedSet.size,
				};
			},
			['finance', 'registry', 'admin']
		);
	}
}

export const blockedStudentsService = serviceWrapper(
	BlockedStudentService,
	'BlockedStudent'
);
