import {
	hasOwnedStudentSession,
	hasPermission,
} from '@/core/auth/sessionPermissions';
import type { sponsors } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import SponsorRepository from './repository';

type Sponsor = typeof sponsors.$inferInsert;

class SponsorService {
	constructor(private readonly repository = new SponsorRepository()) {}

	async get(id: number) {
		return withPermission(async () => this.repository.findById(id), {
			sponsors: ['read'],
		});
	}

	async findAll(params: QueryOptions<typeof sponsors>) {
		return withPermission(async () => this.repository.query(params), {
			sponsors: ['read'],
		});
	}

	async getAll() {
		return withPermission(async () => this.repository.findAll(), {
			sponsors: ['read'],
		});
	}

	async create(data: Sponsor) {
		return withPermission(
			async (session) =>
				this.repository.create(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'sponsor_created',
				}),
			{ sponsors: ['create'] }
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
			{ sponsors: ['update'] }
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
			{ sponsors: ['delete'] }
		);
	}

	async getSponsoredStudent(stdNo: number, termId: number) {
		return withPermission(
			async () => this.repository.findSponsoredStudent(stdNo, termId),
			async (session) =>
				hasPermission(session, 'sponsors', 'read') ||
				hasOwnedStudentSession(session, stdNo)
		);
	}

	async getStudentCurrentSponsorship(stdNo: number) {
		return withPermission(
			async () => this.repository.findCurrentSponsoredStudent(stdNo),
			async (session) =>
				hasPermission(session, 'sponsors', 'read') ||
				hasOwnedStudentSession(session, stdNo)
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
				if (hasPermission(session, 'sponsors', 'update')) {
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
			{ sponsors: ['read'] }
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
			{ sponsors: ['read'] }
		);
	}

	async updateAccountDetails(data: {
		stdNoOrName: string;
		bankName: string;
		accountNumber: string;
	}) {
		return withPermission(
			async () => this.repository.updateAccountDetails(data),
			{ sponsors: ['update'] }
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
			{ sponsors: ['update'] }
		);
	}

	async getStudentSponsors(stdNo: number) {
		return withPermission(
			async () => this.repository.findStudentSponsors(stdNo),
			{
				sponsors: ['read'],
			}
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
			{ sponsors: ['update'] }
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
			{ sponsors: ['update'] }
		);
	}

	async getSponsoredStudentById(id: number) {
		return withPermission(
			async () => this.repository.findSponsoredStudentById(id),
			{
				sponsors: ['read'],
			}
		);
	}
}

export const sponsorsService = serviceWrapper(
	SponsorService,
	'SponsorsService'
);
