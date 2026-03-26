import { auth } from '@/core/auth';
import type { DashboardRole } from '@/core/auth/permissions';
import { hasPermission } from '@/core/auth/sessionPermissions';
import type { autoApprovals } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import AutoApprovalRepository from './repository';

type Rule = typeof autoApprovals.$inferInsert;

class AutoApprovalService {
	constructor(private readonly repository = new AutoApprovalRepository()) {}

	async get(id: number) {
		return withPermission(
			async () => this.repository.findByIdWithRelations(id),
			async (session) =>
				hasPermission(session, 'auto-approvals', 'read') ||
				session?.user?.role === 'finance'
		);
	}

	async findAll(params: QueryOptions<typeof autoApprovals>) {
		return withPermission(
			async () => {
				const session = await auth();
				const role = session?.user?.role as DashboardRole | undefined;
				const department =
					role === 'admin' ? undefined : role === 'finance' ? role : undefined;
				return this.repository.findAllPaginated(params, department);
			},
			async (session) =>
				hasPermission(session, 'auto-approvals', 'read') ||
				session?.user?.role === 'finance'
		);
	}

	async create(data: Rule) {
		return withPermission(
			async (session) => {
				const role = session?.user?.role as DashboardRole;
				if (role !== 'admin' && data.department !== role) {
					throw new UserFacingError(
						'You can only create rules for your own department'
					);
				}
				return this.repository.create(
					{
						...data,
						createdBy: session?.user?.id,
					},
					{
						userId: session!.user!.id!,
						role: session!.user!.role!,
						activityType: 'auto_approval_created',
					}
				);
			},
			async (session) =>
				hasPermission(session, 'auto-approvals', 'create') ||
				session?.user?.role === 'finance'
		);
	}

	async update(id: number, data: Partial<Rule>) {
		return withPermission(
			async (session) => {
				const existing = await this.repository.findById(id);
				if (!existing) throw new Error('Rule not found');

				const role = session?.user?.role as DashboardRole;
				if (role !== 'admin' && existing.department !== role) {
					throw new UserFacingError(
						'You can only update rules for your own department'
					);
				}
				return this.repository.update(id, data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'auto_approval_updated',
				});
			},
			async (session) =>
				hasPermission(session, 'auto-approvals', 'update') ||
				session?.user?.role === 'finance'
		);
	}

	async delete(id: number) {
		return withPermission(
			async (session) => {
				const existing = await this.repository.findById(id);
				if (!existing) throw new Error('Rule not found');

				const role = session?.user?.role as DashboardRole;
				if (role !== 'admin' && existing.department !== role) {
					throw new UserFacingError(
						'You can only delete rules for your own department'
					);
				}
				return this.repository.delete(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'auto_approval_deleted',
				});
			},
			async (session) =>
				hasPermission(session, 'auto-approvals', 'delete') ||
				session?.user?.role === 'finance'
		);
	}

	async findMatchingRules(stdNo: number, termId: number) {
		return this.repository.findMatchingRules(stdNo, termId);
	}

	async bulkCreate(
		rules: { stdNo: number; termCode: string }[],
		department?: DashboardRole
	) {
		return withPermission(
			async (session) => {
				const role = session?.user?.role as DashboardRole;
				const targetDept = role === 'admin' ? department : role;

				if (!targetDept || targetDept !== 'finance') {
					throw new Error('Invalid department for auto-approval rules');
				}

				const termCodes = [...new Set(rules.map((r) => r.termCode))];
				const termMap = new Map<string, number>();

				for (const code of termCodes) {
					const term = await this.repository.findByTermCode(code);
					if (term) {
						termMap.set(code, term.id);
					}
				}

				const validRules = rules
					.filter((r) => termMap.has(r.termCode))
					.map((r) => ({
						stdNo: r.stdNo,
						termId: termMap.get(r.termCode)!,
						department: targetDept,
					}));

				const invalidCount = rules.length - validRules.length;

				const result = await this.repository.bulkCreate(
					validRules,
					session?.user?.id ?? ''
				);

				return {
					...result,
					invalidTermCodes: invalidCount,
				};
			},
			async (session) =>
				hasPermission(session, 'auto-approvals', 'create') ||
				session?.user?.role === 'finance'
		);
	}
}

export const autoApprovalsService = serviceWrapper(
	AutoApprovalService,
	'AutoApprovalService'
);
