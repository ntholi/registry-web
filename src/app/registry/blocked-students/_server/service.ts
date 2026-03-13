import type { DashboardRole } from '@/core/auth/permissions';
import { hasPermission } from '@/core/auth/sessionPermissions';
import type { blockedStudents } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import BlockedStudentRepository from './repository';

type BlockedStudent = typeof blockedStudents.$inferInsert;

class BlockedStudentService {
	constructor(private readonly repository = new BlockedStudentRepository()) {}

	async get(id: number) {
		return withPermission(
			async () => this.repository.findById(id),
			async (session) =>
				hasPermission(session, 'blocked-students', 'read') ||
				session?.user?.role === 'finance'
		);
	}

	async getByStdNo(stdNo: number, status: 'blocked' | 'unblocked' = 'blocked') {
		return withPermission(
			async () => this.repository.findByStdNo(stdNo, status),
			'all'
		);
	}

	async getAll(params: QueryOptions<typeof blockedStudents>) {
		return withPermission(
			async () => this.repository.query(params),
			async (session) =>
				hasPermission(session, 'blocked-students', 'read') ||
				session?.user?.role === 'finance' ||
				session?.user?.role === 'registry'
		);
	}

	async create(data: BlockedStudent) {
		return withPermission(
			async (session) => {
				return this.repository.create(
					{
						...data,
						byDepartment: session?.user?.role as DashboardRole,
						status: 'blocked',
					},
					{
						userId: session!.user!.id!,
						role: session!.user!.role!,
						activityType: 'student_blocked',
						stdNo: data.stdNo,
					}
				);
			},
			async (session) =>
				hasPermission(session, 'blocked-students', 'create') ||
				session?.user?.role === 'finance' ||
				session?.user?.role === 'registry' ||
				session?.user?.role === 'library'
		);
	}

	async update(id: number, data: Partial<BlockedStudent>) {
		const existing = await this.repository.findById(id);
		if (!existing) {
			throw new Error('Blocked student record not found');
		}

		const blockedBy = existing.byDepartment;

		return withPermission(
			async (session) => {
				const activityType =
					data.status === 'unblocked' ? 'student_unblocked' : 'student_blocked';
				return this.repository.update(
					id,
					{
						...data,
						byDepartment: session?.user?.role as DashboardRole,
					},
					{
						userId: session!.user!.id!,
						role: session!.user!.role!,
						activityType,
						stdNo: existing.stdNo,
					}
				);
			},
			async (session) => {
				if (session.user?.role === 'admin') return true;
				if (data.status === 'unblocked') {
					return session.user?.role === blockedBy;
				}
				return (
					hasPermission(session, 'blocked-students', 'update') ||
					session.user?.role === 'finance' ||
					session.user?.role === 'registry' ||
					session.user?.role === 'library'
				);
			}
		);
	}

	async delete(id: number) {
		const existing = await this.repository.findById(id);
		return withPermission(
			async (session) =>
				this.repository.delete(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'student_unblocked',
					stdNo: existing?.stdNo,
				}),
			async (session) =>
				hasPermission(session, 'blocked-students', 'delete') ||
				session?.user?.role === 'admin' ||
				session?.user?.role === 'finance' ||
				session?.user?.role === 'registry' ||
				session?.user?.role === 'library'
		);
	}

	async bulkCreate(
		data: { stdNo: number; reason: string }[],
		department?: string
	) {
		return withPermission(
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
					role: session!.user!.role!,
					activityType: 'student_blocked',
				});

				return {
					imported: toCreate.length,
					skipped: blockedSet.size,
				};
			},
			async (session) =>
				hasPermission(session, 'blocked-students', 'create') ||
				session?.user?.role === 'finance' ||
				session?.user?.role === 'registry' ||
				session?.user?.role === 'admin'
		);
	}
}

export const blockedStudentsService = serviceWrapper(
	BlockedStudentService,
	'BlockedStudent'
);
