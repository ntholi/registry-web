import type { applicants, guardians } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import ApplicantRepository from './repository';

class ApplicantService extends BaseService<typeof applicants, 'id'> {
	private repo: ApplicantRepository;

	constructor() {
		const repo = new ApplicantRepository();
		super(repo, {
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
			updateRoles: ['registry', 'admin'],
			deleteRoles: ['registry', 'admin'],
		});
		this.repo = repo;
	}

	override async get(id: string) {
		return withAuth(async () => this.repo.findById(id), ['registry', 'admin']);
	}

	async search(page: number, search: string) {
		return withAuth(
			async () => this.repo.search(page, search),
			['registry', 'admin']
		);
	}

	override async create(data: typeof applicants.$inferInsert) {
		return withAuth(async () => {
			if (data.nationalId) {
				const existing = await this.repo.findByNationalId(data.nationalId);
				if (existing) {
					throw new Error('DUPLICATE_NATIONAL_ID: National ID already exists');
				}
			}
			return this.repo.create(data);
		}, ['registry', 'admin']);
	}

	override async update(
		id: string,
		data: Partial<typeof applicants.$inferInsert>
	) {
		return withAuth(async () => {
			if (data.nationalId) {
				const existing = await this.repo.findByNationalId(data.nationalId);
				if (existing && existing.id !== id) {
					throw new Error('DUPLICATE_NATIONAL_ID: National ID already exists');
				}
			}
			return this.repo.update(id, data);
		}, ['registry', 'admin']);
	}

	async addPhone(applicantId: string, phoneNumber: string) {
		return withAuth(
			async () => this.repo.addPhone(applicantId, phoneNumber),
			['registry', 'admin']
		);
	}

	async removePhone(phoneId: number) {
		return withAuth(
			async () => this.repo.removePhone(phoneId),
			['registry', 'admin']
		);
	}

	async createGuardian(data: typeof guardians.$inferInsert) {
		return withAuth(
			async () => this.repo.createGuardian(data),
			['registry', 'admin']
		);
	}

	async updateGuardian(
		id: number,
		data: Partial<typeof guardians.$inferInsert>
	) {
		return withAuth(
			async () => this.repo.updateGuardian(id, data),
			['registry', 'admin']
		);
	}

	async deleteGuardian(id: number) {
		return withAuth(
			async () => this.repo.deleteGuardian(id),
			['registry', 'admin']
		);
	}

	async addGuardianPhone(guardianId: number, phoneNumber: string) {
		return withAuth(
			async () => this.repo.addGuardianPhone(guardianId, phoneNumber),
			['registry', 'admin']
		);
	}

	async removeGuardianPhone(phoneId: number) {
		return withAuth(
			async () => this.repo.removeGuardianPhone(phoneId),
			['registry', 'admin']
		);
	}
}

export const applicantsService = serviceWrapper(
	ApplicantService,
	'ApplicantService'
);
