import type { sponsors } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import SponsorRepository from './repository';

type Sponsor = typeof sponsors.$inferInsert;

class SponsorService {
	constructor(private readonly repository = new SponsorRepository()) {}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), ['all']);
	}

	async findAll(params: QueryOptions<typeof sponsors>) {
		return withAuth(async () => this.repository.query(params), ['all']);
	}

	async getAll() {
		return withAuth(async () => this.repository.findAll(), ['all']);
	}

	async create(data: Sponsor) {
		return withAuth(
			async (session) =>
				this.repository.create(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'sponsor_created',
				}),
			['admin', 'finance']
		);
	}

	async update(id: number, data: Sponsor) {
		return withAuth(
			async (session) =>
				this.repository.update(id, data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'sponsor_updated',
				}),
			['admin', 'finance']
		);
	}

	async delete(id: number) {
		return withAuth(
			async (session) =>
				this.repository.delete(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'sponsor_deleted',
				}),
			['admin', 'finance']
		);
	}

	async getSponsoredStudent(stdNo: number, termId: number) {
		return withAuth(
			async () => this.repository.findSponsoredStudent(stdNo, termId),
			['all']
		);
	}

	async getStudentCurrentSponsorship(stdNo: number) {
		return withAuth(
			async () => this.repository.findCurrentSponsoredStudent(stdNo),
			['student', 'registry', 'finance', 'admin']
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
		return withAuth(
			async () => this.repository.upsertSponsoredStudent(data),
			async (session) => {
				const allowedRoles = ['registry', 'finance', 'admin'];

				if (allowedRoles.includes(session.user?.role || '')) {
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
		return withAuth(
			async () =>
				this.repository.findSponsoredStudentsBySponsor(sponsorId, params),
			['all']
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
		return withAuth(
			async () => this.repository.findAllSponsoredStudents(params),
			['all']
		);
	}

	async updateAccountDetails(data: {
		stdNoOrName: string;
		bankName: string;
		accountNumber: string;
	}) {
		return withAuth(
			async () => this.repository.updateAccountDetails(data),
			['admin', 'finance', 'registry']
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
		return withAuth(
			async () => this.repository.bulkUpdateAccountDetails(items, batchSize),
			['admin', 'finance', 'registry']
		);
	}

	async getStudentSponsors(stdNo: number) {
		return withAuth(
			async () => this.repository.findStudentSponsors(stdNo),
			['registry', 'finance', 'admin', 'student_services']
		);
	}

	async createSponsoredStudent(data: {
		stdNo: number;
		sponsorId: number;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
	}) {
		return withAuth(
			async (session) =>
				this.repository.createSponsoredStudent(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'sponsorship_assigned',
					stdNo: data.stdNo,
				}),
			['registry', 'finance', 'admin']
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
		return withAuth(
			async (session) =>
				this.repository.updateSponsoredStudent(id, data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'sponsorship_updated',
				}),
			['registry', 'finance', 'admin']
		);
	}

	async getSponsoredStudentById(id: number) {
		return withAuth(
			async () => this.repository.findSponsoredStudentById(id),
			['registry', 'finance', 'admin', 'student_services']
		);
	}
}

export const sponsorsService = serviceWrapper(
	SponsorService,
	'SponsorsService'
);
