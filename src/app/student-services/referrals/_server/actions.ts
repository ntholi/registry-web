'use server';

import type { referralSessions, studentReferrals } from '@/core/database';
import { withPermission } from '@/core/platform/withPermission';
import { createAction } from '@/shared/lib/actions/actionResult';
import ReferralRepository from './repository';
import { referralsService } from './service';

type Referral = typeof studentReferrals.$inferInsert;
type SessionInput = Omit<typeof referralSessions.$inferInsert, 'conductedBy'>;

const repo = new ReferralRepository();

export async function getReferral(id: string) {
	return withPermission(async () => repo.findById(id), {
		'student-referrals': ['read'],
	});
}

export async function getReferrals(page = 1, search = '') {
	return referralsService.findAll({
		page,
		search,
		searchColumns: ['stdNo', 'reason'],
		sort: [{ column: 'createdAt', order: 'desc' }],
	});
}

export async function getReferralSessions(referralId: string) {
	return referralsService.getSessions(referralId);
}

export async function countPendingReferrals() {
	return referralsService.countPending();
}

export const createReferral = createAction(async (data: Referral) =>
	referralsService.create(data)
);

export const updateReferralStatus = createAction(
	async (id: string, status: string, assignedTo?: string) =>
		referralsService.updateStatus(id, status, assignedTo)
);

export const closeReferral = createAction(
	async (id: string, resolutionSummary: string) =>
		referralsService.close(id, resolutionSummary)
);

export const addReferralSession = createAction(async (data: SessionInput) =>
	referralsService.addSession(data as typeof referralSessions.$inferInsert)
);

export const deleteReferralSession = createAction(async (id: string) =>
	referralsService.deleteSession(id)
);
