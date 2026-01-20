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
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
			updateRoles: ['registry', 'admin'],
			deleteRoles: ['registry', 'admin'],
		});
		this.repo = repo;
	}

	override async get(id: string) {
		return withAuth(
			async () => this.repo.findById(id),
			['registry', 'admin', 'applicant']
		);
	}

	async search(page: number, search: string) {
		return withAuth(
			async () => this.repo.search(page, search),
			['registry', 'admin']
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
		}, ['registry', 'admin']);
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
		}, ['registry', 'admin']);
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
		}, ['registry', 'admin']);
	}

	async isInUse(id: string) {
		return withAuth(async () => this.repo.isInUse(id), ['registry', 'admin']);
	}

	async mapGrade(certificateTypeId: string, originalGrade: string) {
		return withAuth(
			async () => this.repo.mapGrade(certificateTypeId, originalGrade),
			['registry', 'admin']
		);
	}
}

export const certificateTypesService = serviceWrapper(
	CertificateTypeService,
	'CertificateTypeService'
);
