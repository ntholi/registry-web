import { auth } from '@/core/auth';
import type { autoApprovals, DashboardUser } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import AutoApprovalRepository from './repository';

type Rule = typeof autoApprovals.$inferInsert;

class AutoApprovalService {
	constructor(private readonly repository = new AutoApprovalRepository()) {}

	async get(id: number) {
		return withAuth(
			async () => this.repository.findByIdWithRelations(id),
			['finance', 'library', 'admin']
		);
	}

	async findAll(params: QueryOptions<typeof autoApprovals>) {
		return withAuth(async () => {
			const session = await auth();
			const role = session?.user?.role as DashboardUser | undefined;
			const department =
				role === 'admin'
					? undefined
					: ['finance', 'library'].includes(role ?? '')
						? role
						: undefined;
			return this.repository.findAllPaginated(params, department);
		}, ['finance', 'library', 'admin']);
	}

	async create(data: Rule) {
		return withAuth(
			async (session) => {
				const role = session?.user?.role as DashboardUser;
				if (role !== 'admin' && data.department !== role) {
					throw new Error('You can only create rules for your own department');
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
			['finance', 'library', 'admin']
		);
	}

	async update(id: number, data: Partial<Rule>) {
		return withAuth(
			async (session) => {
				const existing = await this.repository.findById(id);
				if (!existing) throw new Error('Rule not found');

				const role = session?.user?.role as DashboardUser;
				if (role !== 'admin' && existing.department !== role) {
					throw new Error('You can only update rules for your own department');
				}
				return this.repository.update(id, data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'auto_approval_updated',
				});
			},
			['finance', 'library', 'admin']
		);
	}

	async delete(id: number) {
		return withAuth(
			async (session) => {
				const existing = await this.repository.findById(id);
				if (!existing) throw new Error('Rule not found');

				const role = session?.user?.role as DashboardUser;
				if (role !== 'admin' && existing.department !== role) {
					throw new Error('You can only delete rules for your own department');
				}
				return this.repository.delete(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'auto_approval_deleted',
				});
			},
			['finance', 'library', 'admin']
		);
	}

	async findMatchingRules(stdNo: number, termId: number) {
		return this.repository.findMatchingRules(stdNo, termId);
	}

	async bulkCreate(
		rules: { stdNo: number; termCode: string }[],
		department?: DashboardUser
	) {
		return withAuth(
			async (session) => {
				const role = session?.user?.role as DashboardUser;
				const targetDept = role === 'admin' ? department : role;

				if (!targetDept || !['finance', 'library'].includes(targetDept)) {
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
			['finance', 'library', 'admin']
		);
	}
}

export const autoApprovalsService = serviceWrapper(
	AutoApprovalService,
	'AutoApprovalService'
);
