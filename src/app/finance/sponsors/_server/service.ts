import type { Session } from '@/core/auth';
import { hasPermission } from '@/core/auth/permissions';
import type { sponsors } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import SponsorRepository from './repository';

type Sponsor = typeof sponsors.$inferInsert;

function canReadSponsors(session: Session | null | undefined) {
	return (
		hasPermission(session, 'sponsors', 'read') ||
		session?.user?.role === 'registry'
	);
}

function canCreateSponsors(session: Session | null | undefined) {
	return hasPermission(session, 'sponsors', 'create');
}

function canUpdateSponsors(session: Session | null | undefined) {
	return (
		hasPermission(session, 'sponsors', 'update') ||
		session?.user?.role === 'registry'
	);
}

function canDeleteSponsors(session: Session | null | undefined) {
	return hasPermission(session, 'sponsors', 'delete');
}

function canAccessStudentSponsor(
	session: Session | null | undefined,
	stdNo: number
) {
	if (canReadSponsors(session)) {
		return true;
	}

	return session?.user?.role === 'student' && session.user.stdNo === stdNo;
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

				if (session.user?.role === 'student') {
					return session.user.stdNo === data.stdNo;
				}

				return false;
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
				canReadSponsors(session) || session?.user?.role === 'student_services'
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
				canReadSponsors(session) || session?.user?.role === 'student_services'
		);
	}
}

export const sponsorsService = serviceWrapper(
	SponsorService,
	'SponsorsService'
);
