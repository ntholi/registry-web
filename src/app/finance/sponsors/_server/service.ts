import {
	hasOwnedStudentSession,
	hasSessionPermission,
	hasSessionRole,
} from '@/core/auth/sessionPermissions';
import type { sponsors } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import SponsorRepository from './repository';

type Sponsor = typeof sponsors.$inferInsert;

const REGISTRY_SPONSOR_ROLES = ['registry'] as const;
const STUDENT_SUPPORT_ROLES = ['student_services'] as const;

function canReadSponsors(session: Parameters<typeof hasSessionPermission>[0]) {
	return hasSessionPermission(
		session,
		'sponsors',
		'read',
		REGISTRY_SPONSOR_ROLES
	);
}

function canCreateSponsors(
	session: Parameters<typeof hasSessionPermission>[0]
) {
	return hasSessionPermission(session, 'sponsors', 'create');
}

function canUpdateSponsors(
	session: Parameters<typeof hasSessionPermission>[0]
) {
	return hasSessionPermission(
		session,
		'sponsors',
		'update',
		REGISTRY_SPONSOR_ROLES
	);
}

function canDeleteSponsors(
	session: Parameters<typeof hasSessionPermission>[0]
) {
	return hasSessionPermission(session, 'sponsors', 'delete');
}

function canAccessStudentSponsor(
	session: Parameters<typeof hasSessionPermission>[0],
	stdNo: number
) {
	if (canReadSponsors(session)) {
		return true;
	}

	return hasOwnedStudentSession(session, stdNo);
}

class SponsorService {
	constructor(private readonly repository = new SponsorRepository()) {}

	async get(id: number) {
		return withPermission(
			async () => this.repository.findById(id),
			async (session) => canReadSponsors(session)
		);
	}

	async findAll(params: QueryOptions<typeof sponsors>) {
		return withPermission(
			async () => this.repository.query(params),
			async (session) => canReadSponsors(session)
		);
	}

	async getAll() {
		return withPermission(
			async () => this.repository.findAll(),
			async (session) => canReadSponsors(session)
		);
	}

	async create(data: Sponsor) {
		return withPermission(
			async (session) =>
				this.repository.create(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'sponsor_created',
				}),
			async (session) => canCreateSponsors(session)
		);
	}

	async update(id: number, data: Sponsor) {
		return withPermission(
			async (session) =>
				this.repository.update(id, data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'sponsor_updated',
				}),
			async (session) => canUpdateSponsors(session)
		);
	}

	async delete(id: number) {
		return withPermission(
			async (session) =>
				this.repository.delete(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'sponsor_deleted',
				}),
			async (session) => canDeleteSponsors(session)
		);
	}

	async getSponsoredStudent(stdNo: number, termId: number) {
		return withPermission(
			async () => this.repository.findSponsoredStudent(stdNo, termId),
			async (session) => canAccessStudentSponsor(session, stdNo)
		);
	}

	async getStudentCurrentSponsorship(stdNo: number) {
		return withPermission(
			async () => this.repository.findCurrentSponsoredStudent(stdNo),
			async (session) => canAccessStudentSponsor(session, stdNo)
		);
	}

	async updateStudentSponsorship(data: {
		stdNo: number;
		termId: number;
		sponsorId: number;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
	}) {
		return withPermission(
			async () => this.repository.upsertSponsoredStudent(data),
			async (session) => {
				if (canUpdateSponsors(session)) {
					return true;
				}

				return hasOwnedStudentSession(session, data.stdNo);
			}
		);
	}

	async getSponsoredStudents(
		sponsorId: string,
		params?: { page?: number; limit?: number; search?: string }
	) {
		return withPermission(
			async () =>
				this.repository.findSponsoredStudentsBySponsor(sponsorId, params),
			async (session) => canReadSponsors(session)
		);
	}

	async getAllSponsoredStudents(params?: {
		page?: number;
		limit?: number;
		search?: string;
		sponsorId?: string;
		programId?: string;
		termId?: string;
		clearedOnly?: boolean;
	}) {
		return withPermission(
			async () => this.repository.findAllSponsoredStudents(params),
			async (session) => canReadSponsors(session)
		);
	}

	async updateAccountDetails(data: {
		stdNoOrName: string;
		bankName: string;
		accountNumber: string;
	}) {
		return withPermission(
			async () => this.repository.updateAccountDetails(data),
			async (session) => canUpdateSponsors(session)
		);
	}

	async bulkUpdateAccountDetails(
		items: Array<{
			stdNoOrName: string;
			bankName: string;
			accountNumber: string;
		}>,
		batchSize: number = 100
	) {
		return withPermission(
			async () => this.repository.bulkUpdateAccountDetails(items, batchSize),
			async (session) => canUpdateSponsors(session)
		);
	}

	async getStudentSponsors(stdNo: number) {
		return withPermission(
			async () => this.repository.findStudentSponsors(stdNo),
			async (session) =>
				canReadSponsors(session) ||
				hasSessionRole(session, STUDENT_SUPPORT_ROLES)
		);
	}

	async createSponsoredStudent(data: {
		stdNo: number;
		sponsorId: number;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
	}) {
		return withPermission(
			async (session) =>
				this.repository.createSponsoredStudent(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'sponsorship_assigned',
					stdNo: data.stdNo,
				}),
			async (session) => canUpdateSponsors(session)
		);
	}

	async updateSponsoredStudent(
		id: number,
		data: {
			sponsorId?: number;
			borrowerNo?: string | null;
			bankName?: string | null;
			accountNumber?: string | null;
		}
	) {
		return withPermission(
			async (session) =>
				this.repository.updateSponsoredStudent(id, data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'sponsorship_updated',
				}),
			async (session) => canUpdateSponsors(session)
		);
	}

	async getSponsoredStudentById(id: number) {
		return withPermission(
			async () => this.repository.findSponsoredStudentById(id),
			async (session) =>
				canReadSponsors(session) ||
				hasSessionRole(session, STUDENT_SUPPORT_ROLES)
		);
	}
}

export const sponsorsService = serviceWrapper(
	SponsorService,
	'SponsorsService'
);
