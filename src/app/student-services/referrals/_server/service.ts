import { triggerReferralCreatedEmail } from '@mail/_server/trigger-service';
import { eq } from 'drizzle-orm';
import type { referralSessions, studentReferrals } from '@/core/database';
import { db, users } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import ReferralRepository from './repository';

const VALID_TRANSITIONS: Record<string, string[]> = {
	pending: ['in_progress'],
	in_progress: ['resolved'],
	resolved: ['closed'],
};

class ReferralService extends BaseService<typeof studentReferrals, 'id'> {
	constructor() {
		super(new ReferralRepository(), {
			byIdAuth: { 'student-referrals': ['read'] },
			findAllAuth: { 'student-referrals': ['read'] },
			createAuth: { 'student-referrals': ['create'] },
			updateAuth: { 'student-referrals': ['update'] },
			deleteAuth: { 'student-referrals': ['delete'] },
			countAuth: 'dashboard',
			activityTypes: {
				create: 'student_referral_created',
				update: 'student_referral_updated',
				delete: 'student_referral_deleted',
			},
		});
	}

	private get repo() {
		return this.repository as ReferralRepository;
	}

	override async create(data: typeof studentReferrals.$inferInsert) {
		return withPermission(async (session) => {
			if (data.reason === 'other' && !data.otherReason) {
				throw new UserFacingError(
					'Other reason is required when reason is "other"'
				);
			}

			const audit = this.buildAuditOptions(session, 'create');
			const referral = await this.repo.create(
				{
					...data,
					referredBy: session!.user!.id!,
					status: 'pending',
				},
				audit
			);

			const full = await this.repo.findById(referral.id);
			if (full) {
				const studentServicesUsers = await db
					.select({ email: users.email })
					.from(users)
					.where(eq(users.role, 'student_services'));

				const emails = studentServicesUsers.map((u) => u.email);

				triggerReferralCreatedEmail({
					referralId: referral.id,
					studentName:
						(full as { student?: { name: string } }).student?.name ??
						String(data.stdNo),
					stdNo: data.stdNo as number,
					reason: data.reason!,
					description: data.description!,
					referrerName: session!.user!.name!,
					recipientEmails: emails,
				}).catch(() => {});
			}

			return referral;
		}, this.createAuth());
	}

	async updateStatus(id: string, newStatus: string, assignedTo?: string) {
		return withPermission(
			async (session) => {
				const referral = await this.repo.findById(id);
				if (!referral) {
					throw new UserFacingError('Referral not found');
				}

				const allowed = VALID_TRANSITIONS[referral.status];
				if (!allowed?.includes(newStatus)) {
					throw new UserFacingError(
						`Cannot transition from "${referral.status}" to "${newStatus}"`
					);
				}

				const updateData: Partial<typeof studentReferrals.$inferInsert> = {
					status: newStatus as typeof referral.status,
				};

				if (newStatus === 'in_progress' && assignedTo) {
					updateData.assignedTo = assignedTo;
				}

				const audit = this.buildAuditOptions(session, 'update');
				return this.repo.update(id, updateData, audit);
			},
			{ 'student-referrals': ['update'] }
		);
	}

	async close(id: string, resolutionSummary: string) {
		return withPermission(
			async (session) => {
				const referral = await this.repo.findById(id);
				if (!referral) {
					throw new UserFacingError('Referral not found');
				}

				if (referral.status !== 'resolved') {
					throw new UserFacingError('Only resolved referrals can be closed');
				}

				const audit = this.buildAuditOptions(session, 'update');
				return this.repo.update(
					id,
					{
						status: 'closed',
						resolutionSummary,
						closedAt: new Date(),
						closedBy: session!.user!.id!,
					},
					audit
				);
			},
			{ 'student-referrals': ['update'] }
		);
	}

	async addSession(data: typeof referralSessions.$inferInsert) {
		return withPermission(
			async (session) => {
				const audit = this.buildAuditOptions(session, 'create');
				return this.repo.addSession(
					{ ...data, conductedBy: session!.user!.id! },
					audit
						? { ...audit, activityType: 'referral_session_created' }
						: undefined
				);
			},
			{ 'student-referrals': ['update'] }
		);
	}

	async deleteSession(id: string) {
		return withPermission(
			async (session) => {
				const audit = this.buildAuditOptions(session, 'delete');
				return this.repo.deleteSession(
					id,
					audit
						? { ...audit, activityType: 'referral_session_deleted' }
						: undefined
				);
			},
			{ 'student-referrals': ['delete'] }
		);
	}

	async countPending() {
		return withPermission(async () => this.repo.countPending(), 'dashboard');
	}

	async getSessions(referralId: string) {
		return withPermission(
			async () => this.repo.findSessionsByReferral(referralId),
			{ 'student-referrals': ['read'] }
		);
	}
}

export const referralsService = serviceWrapper(
	ReferralService,
	'ReferralService'
);
