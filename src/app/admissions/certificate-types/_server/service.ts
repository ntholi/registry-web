import type { certificateTypes, gradeMappings } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import CertificateTypeRepository from './repository';

type GradeMapping = {
	originalGrade: string;
	standardGrade: (typeof gradeMappings.$inferInsert)['standardGrade'];
};

class CertificateTypeService extends BaseService<
	typeof certificateTypes,
	'id'
> {
	private repo: CertificateTypeRepository;

	constructor() {
		const repo = new CertificateTypeRepository();
		super(repo, {
			byIdRoles: ['registry', 'marketing', 'admin'],
			findAllRoles: ['registry', 'marketing', 'admin'],
			createRoles: ['registry', 'marketing', 'admin'],
			updateRoles: ['registry', 'marketing', 'admin'],
			deleteRoles: ['registry', 'marketing', 'admin'],
		});
		this.repo = repo;
	}

	override async get(id: string) {
		return withAuth(
			async () => this.repo.findById(id),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async search(page: number, search: string) {
		return withAuth(
			async () => this.repo.search(page, search),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async createWithMappings(
		data: typeof certificateTypes.$inferInsert,
		mappings?: GradeMapping[]
	) {
		return withAuth(async () => {
			if (data.lqfLevel < 4) {
				throw new Error('INVALID_LQF_LEVEL: LQF level must be 4 or higher');
			}

			return this.repo.createWithMappings(data, mappings);
		}, ['registry', 'marketing', 'admin']);
	}

	async updateWithMappings(
		id: string,
		data: Partial<typeof certificateTypes.$inferInsert>,
		mappings?: GradeMapping[]
	) {
		return withAuth(async () => {
			if (data.lqfLevel !== undefined && data.lqfLevel < 4) {
				throw new Error('INVALID_LQF_LEVEL: LQF level must be 4 or higher');
			}

			return this.repo.updateWithMappings(id, data, mappings);
		}, ['registry', 'marketing', 'admin']);
	}

	override async delete(id: string) {
		return withAuth(async () => {
			const isInUse = await this.repo.isInUse(id);
			if (isInUse) {
				throw new Error(
					'CERTIFICATE_TYPE_IN_USE: Cannot delete certificate type in use'
				);
			}

			await this.repo.removeById(id);
		}, ['registry', 'marketing', 'admin']);
	}

	async isInUse(id: string) {
		return withAuth(
			async () => this.repo.isInUse(id),
			['registry', 'marketing', 'admin']
		);
	}

	async mapGrade(certificateTypeId: string, originalGrade: string) {
		return withAuth(
			async () => this.repo.mapGrade(certificateTypeId, originalGrade),
			['registry', 'marketing', 'admin']
		);
	}
}

export const certificateTypesService = serviceWrapper(
	CertificateTypeService,
	'CertificateTypeService'
);
